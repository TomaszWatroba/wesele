// server.js - Enhanced server with comprehensive logging
const express = require('express');
const config = require('./config');
const { 
    initializeDirectories, 
    logActivity, 
    logError, 
    requestLogger,
    getSystemHealth,
    performanceLogger
} = require('./utils');
const { 
    securityMiddleware, 
    protectFilesMiddleware, 
    notFoundHandler, 
    errorHandler,
    timeoutMiddleware,
    memoryMonitor
} = require('./middleware');  // Points to middleware/index.js

// Import tras
const mainRoutes = require('./routes');
const apiRoutes = require('./api-routes');

const app = express();

// 🚀 Server startup logging
const startupPerf = performanceLogger('serverStartup');
logActivity('INFO', 'Wedding Photos App starting...', '', null, {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    cwd: process.cwd()
});

// 🔧 Inicjalizacja
try {
    initializeDirectories();
    logActivity('SUCCESS', 'Directories initialized');
} catch (error) {
    logError(error, 'Failed to initialize directories');
    process.exit(1);
}

// 🛡️ Enhanced middleware stack with logging
logActivity('INFO', 'Setting up middleware stack...');

// Request ID and logging (FIRST)
app.use(requestLogger);

// Memory monitoring (early in stack)
app.use(memoryMonitor);

// Timeout protection
app.use(timeoutMiddleware());

// Security middleware
app.use(securityMiddleware);

// Static files
app.use(express.static('public', {
    setHeaders: (res, path) => {
        logActivity('DEBUG', 'Static file served', path);
    }
}));

// Body parsing with size limits
app.use(express.json({ 
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
        if (buf.length > 50 * 1024 * 1024) {
            logActivity('WARN', 'Large JSON body', `${buf.length} bytes`, req.requestId);
        }
    }
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '50mb',
    verify: (req, res, buf, encoding) => {
        if (buf.length > 50 * 1024 * 1024) {
            logActivity('WARN', 'Large URL-encoded body', `${buf.length} bytes`, req.requestId);
        }
    }
}));

// 📷 Protected uploads directory
app.use('/uploads', (req, res, next) => {
    logActivity('DEBUG', 'Upload directory access', req.path, req.requestId);
    next();
}, protectFilesMiddleware, express.static(config.UPLOADS_DIR));

// 🛣️ Routes with logging
app.use('/api', (req, res, next) => {
    logActivity('DEBUG', 'API route accessed', `${req.method} ${req.path}`, req.requestId);
    next();
}, apiRoutes);

app.use('/', (req, res, next) => {
    logActivity('DEBUG', 'Main route accessed', `${req.method} ${req.path}`, req.requestId);
    next();
}, mainRoutes);

// 📊 Health check endpoint
app.get('/health', (req, res) => {
    const health = getSystemHealth();
    logActivity('DEBUG', 'Health check requested', '', req.requestId, health);
    res.json(health);
});

// 📋 Debug endpoint for logs (development only)
app.get('/debug/logs', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        logActivity('WARN', 'Debug logs access denied in production', '', req.requestId);
        return res.status(403).json({ error: 'Debug endpoints disabled in production' });
    }
    
    try {
        const fs = require('fs');
        const logs = fs.readFileSync(config.LOG_FILE, 'utf8');
        const recentLogs = logs.split('\n').slice(-100).reverse(); // Last 100 lines
        
        logActivity('DEBUG', 'Debug logs accessed', '', req.requestId);
        res.json({ 
            logs: recentLogs,
            totalLines: logs.split('\n').length,
            logFile: config.LOG_FILE
        });
    } catch (error) {
        logError(error, 'Failed to read debug logs', req.requestId);
        res.status(500).json({ error: 'Failed to read logs' });
    }
});

// 🚨 Error handling (MUST BE LAST)
app.use('*', notFoundHandler);
app.use(errorHandler);

// 🚀 Server startup with enhanced logging
const server = app.listen(config.PORT, '0.0.0.0', () => {
    startupPerf.end();
    
    const startupMessage = `
🎉 Wedding Photos uruchomione!

📍 Panel organizatora: http://localhost:${config.PORT}
📱 Strona dla gości: http://localhost:${config.PORT}/upload
📊 Health check: http://localhost:${config.PORT}/health
📋 Debug logs: http://localhost:${config.PORT}/debug/logs (dev only)
📁 Zdjęcia zapisywane w: ${config.UPLOADS_DIR}
📝 Logi w: ${config.LOG_FILE}

✨ FUNKCJE:
- ✅ ZERO haseł - maksymalna prostota dla gości
- ✅ Pliki RAZ przesłane = NA ZAWSZE bezpieczne
- ✅ Automatyczna ochrona przed usuwaniem
- ✅ Rate limiting (${config.RATE_LIMIT.MAX_UPLOADS} przesłań / ${config.RATE_LIMIT.WINDOW_MS/1000/60} min)
- ✅ Obsługa zdjęć i filmów (do ${config.MAX_FILE_SIZE/1024/1024}MB)
- ✅ Enhanced logging - znajdziesz każdy problem!

🛡️ BEZPIECZEŃSTWO:
- ✅ Tylko upload i odczyt - ZERO usuwania
- ✅ Bezpieczne nazwy plików (losowe)
- ✅ Walidacja typów plików
- ✅ Blokada niebezpiecznych metod HTTP
- ✅ Comprehensive request/response logging
- ✅ Memory usage monitoring
- ✅ Request timeout protection

🔍 DEBUGGING:
- ✅ Unique request IDs for tracking
- ✅ Color-coded console output
- ✅ Performance monitoring
- ✅ File upload detailed logging
- ✅ Security event tracking
- ✅ Error stack traces with context

💡 NASTĘPNE KROKI:
1. Zmień EVENT_NAME w config.js na swoją nazwę
2. Uruchom Cloudflare Tunnel: cloudflared tunnel --url http://localhost:${config.PORT}
3. Wygeneruj QR kod w panelu organizatora
4. Wydrukuj QR kod dla gości
5. Gotowe! 🚀

🌐 TUNELOWANIE:
Aby udostępnić przez internet, uruchom w nowym oknie PowerShell:
cloudflared tunnel --url http://localhost:${config.PORT}
    `;
    
    console.log(startupMessage);
    
    logActivity('SUCCESS', 'Server started successfully', '', null, {
        port: config.PORT,
        eventName: config.EVENT_NAME,
        maxFileSize: `${config.MAX_FILE_SIZE/1024/1024}MB`,
        maxFilesPerUpload: config.MAX_FILES_PER_UPLOAD,
        uploadsDir: config.UPLOADS_DIR,
        logFile: config.LOG_FILE,
        rateLimit: `${config.RATE_LIMIT.MAX_UPLOADS} uploads per ${config.RATE_LIMIT.WINDOW_MS/1000/60} minutes`
    });
    
    // Log system information
    const systemInfo = getSystemHealth();
    logActivity('INFO', 'System information', '', null, systemInfo);
    
    // Start periodic health monitoring
    setInterval(() => {
        const health = getSystemHealth();
        logActivity('DEBUG', 'Periodic health check', '', null, health);
    }, 5 * 60 * 1000); // Every 5 minutes
});

// 🛑 Enhanced graceful shutdown with logging
const gracefulShutdown = (signal) => {
    const shutdownPerf = performanceLogger('gracefulShutdown');
    
    logActivity('INFO', 'Shutdown initiated', `Received ${signal}`, null, {
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage()
    });
    
    console.log(`\n👋 Zamykanie Wedding Photos (${signal})...`);
    
    // Close the server
    server.close((err) => {
        if (err) {
            logError(err, 'Error during server shutdown');
        } else {
            logActivity('SUCCESS', 'HTTP server closed');
        }
        
        // Give time for final logs to write
        setTimeout(() => {
            shutdownPerf.end('shutdown completed');
            
            console.log('✅ Wszystkie zdjęcia pozostają bezpieczne w folderze:', config.UPLOADS_DIR);
            console.log('📋 Logi aktywności zapisane w:', config.LOG_FILE);
            
            logActivity('INFO', 'Wedding Photos app stopped gracefully', '', null, {
                totalUptime: Math.floor(process.uptime()),
                finalMemoryUsage: process.memoryUsage()
            });
            
            process.exit(0);
        }, 1000);
    });
    
    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
        logActivity('ERROR', 'Forced shutdown - graceful shutdown timeout');
        console.log('⚠️ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// 🎯 Enhanced process event handlers
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Enhanced uncaught exception handler
process.on('uncaughtException', (error) => {
    logError(error, 'Uncaught Exception - Server will shut down');
    console.error('💥 CRITICAL: Uncaught Exception:', error);
    
    // Try to log final system state
    try {
        const finalState = {
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            pid: process.pid
        };
        logActivity('ERROR', 'Final system state before crash', '', null, finalState);
    } catch (e) {
        console.error('Failed to log final system state:', e);
    }
    
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Enhanced unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logActivity('ERROR', 'Unhandled Promise Rejection', '', null, {
        reason: String(reason),
        promise: promise.toString(),
        stack: reason?.stack
    });
    
    console.error('💥 CRITICAL: Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    
    // Don't exit on unhandled rejection, just log it
    // gracefulShutdown('UNHANDLED_REJECTION');
});

// Memory warning handler
process.on('warning', (warning) => {
    logActivity('WARN', 'Node.js Warning', warning.message, null, {
        name: warning.name,
        code: warning.code,
        detail: warning.detail,
        stack: warning.stack
    });
});

// Export for testing
module.exports = { app, server };