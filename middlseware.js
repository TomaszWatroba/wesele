// middleware.js - Enhanced middleware with detailed logging
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { 
    logActivity, 
    logError, 
    logFileUpload, 
    logSecurityEvent, 
    generateSafeFilename,
    performanceLogger 
} = require('./utils');

// 🚫 Enhanced rate limiting with detailed logging
const uploadLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_UPLOADS,
    message: {
        error: 'Chwilę pauzy - za dużo przesłań naraz. Spróbuj za chwilę 😊'
    },
    standardHeaders: false,
    legacyHeaders: false,
    
    // Enhanced logging for rate limiting
    onLimitReached: (req) => {
        logSecurityEvent(
            'Rate limit exceeded', 
            `IP: ${req.ip}, User-Agent: ${req.get('User-Agent')}`,
            req.requestId,
            'WARN'
        );
    },
    
    // Log when someone is close to limit
    skip: (req) => {
        if (req.rateLimit && req.rateLimit.remaining <= 3) {
            logActivity('WARN', 'Rate limit warning', 
                `${req.rateLimit.remaining} uploads remaining for IP: ${req.ip}`, 
                req.requestId
            );
        }
        return false;
    }
});

// 🔍 Enhanced debug middleware for upload requests
const debugUpload = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('DEBUG', 'Upload request analysis', '', requestId, {
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userAgent: req.get('User-Agent'),
        acceptLanguage: req.get('Accept-Language'),
        bodyKeys: Object.keys(req.body || {}),
        hasMultipart: !!(req.get('Content-Type') && req.get('Content-Type').includes('multipart/form-data')),
        ip: req.ip || req.connection.remoteAddress
    });
    
    // Check if multipart/form-data is present
    if (!req.get('Content-Type') || !req.get('Content-Type').includes('multipart/form-data')) {
        logActivity('ERROR', 'Missing multipart header', 
            'Request missing multipart/form-data Content-Type', requestId);
    }
    
    next();
};

// 📦 Enhanced multer configuration with comprehensive logging
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        logActivity('DEBUG', 'Multer destination', config.UPLOADS_DIR, req.requestId);
        cb(null, config.UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const perf = performanceLogger('generateFilename');
        const safeFilename = generateSafeFilename(file.originalname);
        perf.end();
        
        logActivity('DEBUG', 'Multer filename', 
            `${file.originalname} -> ${safeFilename}`, req.requestId);
        cb(null, safeFilename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: config.MAX_FILES_PER_UPLOAD,
        fieldSize: 10 * 1024 * 1024, // 10MB field size limit
        fields: 10 // Max number of non-file fields
    },
    
    // Enhanced file filter with detailed logging
    fileFilter: (req, file, cb) => {
        const requestId = req.requestId || 'no-id';
        
        logActivity('DEBUG', 'Multer file validation started', '', requestId, {
            filename: file.originalname,
            mimetype: file.mimetype || 'empty',
            fieldname: file.fieldname,
            encoding: file.encoding
        });
        
        const fileName = file.originalname.toLowerCase();
        const mimeType = file.mimetype || '';
        
        // Enhanced security: Check for dangerous extensions
        const bannedExts = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.jar', 
                           '.php', '.asp', '.jsp', '.ps1', '.vbs', '.js', '.sh'];
        const ext = require('path').extname(fileName);
        
        if (bannedExts.includes(ext)) {
            const errorMsg = `Blocked dangerous file extension: ${ext}`;
            logSecurityEvent('Dangerous file blocked', errorMsg, requestId, 'ERROR');
            logFileUpload('File rejected - dangerous extension', [file], requestId, {
                reason: 'Dangerous extension',
                extension: ext
            });
            return cb(new Error('Zabroniony typ pliku - potencjalnie niebezpieczny'));
        }
        
        // Check file size (additional check)
        if (file.size && file.size > config.MAX_FILE_SIZE) {
            logActivity('WARN', 'File too large', 
                `${file.originalname}: ${Math.round(file.size / 1024 / 1024)}MB`, requestId);
            logFileUpload('File rejected - too large', [file], requestId, {
                reason: 'File too large',
                size: file.size,
                maxSize: config.MAX_FILE_SIZE
            });
            return cb(new Error('Plik za duży'));
        }
        
        // Accept all other files (images, videos, etc.)
        logActivity('SUCCESS', 'File validation passed', 
            `${file.originalname} (${mimeType || 'no MIME'})`, requestId);
        logFileUpload('File accepted', [file], requestId, {
            mimetype: mimeType,
            size: file.size
        });
        
        cb(null, true);
    }
});

// 🛡️ Enhanced security middleware with detailed logging
const securityMiddleware = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    // Log all incoming requests
    logActivity('DEBUG', 'Security check', `${req.method} ${req.path}`, requestId, {
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        xForwardedFor: req.get('X-Forwarded-For')
    });
    
    // Block dangerous HTTP methods
    const allowedMethods = ['GET', 'POST', 'OPTIONS'];
    if (!allowedMethods.includes(req.method)) {
        logSecurityEvent('Blocked HTTP method', 
            `Blocked ${req.method} request to ${req.path}`, requestId, 'ERROR');
        return res.status(405).json({ error: 'Metoda nie dozwolona' });
    }
    
    // Check for suspicious patterns in URL
    const suspiciousPatterns = [
        /\.\./,           // Directory traversal
        /\/\./,           // Hidden files
        /\<script\>/i,    // XSS attempts
        /javascript:/i,   // JavaScript injection
        /vbscript:/i,     // VBScript injection
        /onload=/i,       // Event handler injection
        /onerror=/i       // Error handler injection
    ];
    
    const hasSuspiciousPattern = suspiciousPatterns.some(pattern => 
        pattern.test(req.url) || pattern.test(req.path)
    );
    
    if (hasSuspiciousPattern) {
        logSecurityEvent('Suspicious URL pattern detected', 
            `URL: ${req.url}`, requestId, 'ERROR');
        return res.status(400).json({ error: 'Nieprawidłowe żądanie' });
    }
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // CORS handling with logging
    if (req.get('Origin')) {
        logActivity('DEBUG', 'CORS request', `Origin: ${req.get('Origin')}`, requestId);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    
    logActivity('DEBUG', 'Security check passed', '', requestId);
    next();
};

// 📷 Enhanced file protection middleware
const protectFilesMiddleware = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('DEBUG', 'File access attempt', `${req.method} ${req.path}`, requestId);
    
    if (req.method !== 'GET') {
        logSecurityEvent('Non-GET file access blocked', 
            `Blocked ${req.method} access to ${req.path}`, requestId, 'WARN');
        return res.status(403).json({ error: 'Tylko odczyt dozwolony' });
    }
    
    // Add cache headers for files
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('ETag', `"${Date.now()}"`);
    
    logActivity('SUCCESS', 'File access granted', req.path, requestId);
    next();
};

// ❌ Enhanced 404 handler with logging
const notFoundHandler = (req, res) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('WARN', '404 - Page not found', req.path, requestId, {
        method: req.method,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
    });
    
    res.status(404).send(`
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Strona nie znaleziona</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0;
                color: white;
                text-align: center;
            }
            .error-box {
                background: rgba(255,255,255,0.1);
                padding: 50px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            h1 { font-size: 4em; margin-bottom: 20px; }
            p { font-size: 1.2em; margin-bottom: 30px; }
            a { 
                color: #feca57; 
                text-decoration: none; 
                background: rgba(254,202,87,0.2);
                padding: 15px 30px;
                border-radius: 25px;
                display: inline-block;
                transition: all 0.3s ease;
            }
            a:hover { background: rgba(254,202,87,0.3); transform: translateY(-2px); }
            .debug { 
                margin-top: 20px; 
                font-size: 0.8em; 
                opacity: 0.7; 
            }
        </style>
    </head>
    <body>
        <div class="error-box">
            <h1>🤔</h1>
            <p>Hmm, ta strona nie istnieje...</p>
            <a href="/">🏠 Powrót do strony głównej</a>
            <div class="debug">
                Request ID: ${requestId}<br>
                Path: ${req.path}
            </div>
        </div>
    </body>
    </html>
    `);
};

// 🚨 Enhanced error handler with comprehensive logging
const errorHandler = (error, req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    // Log the error with full context
    logError(error, `Request error on ${req.method} ${req.path}`, requestId);
    
    // Special handling for multer errors
    if (error instanceof multer.MulterError) {
        logActivity('ERROR', 'Multer error', '', requestId, {
            code: error.code,
            field: error.field,
            message: error.message
        });
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                logFileUpload('Upload failed - file too large', [], requestId, {
                    maxSize: `${config.MAX_FILE_SIZE / 1024 / 1024}MB`,
                    error: error.message
                });
                return res.status(400).json({ 
                    error: `Plik jest za duży. Maksymalny rozmiar to ${config.MAX_FILE_SIZE / 1024 / 1024}MB.`,
                    code: 'FILE_TOO_LARGE'
                });
                
            case 'LIMIT_FILE_COUNT':
                logFileUpload('Upload failed - too many files', [], requestId, {
                    maxFiles: config.MAX_FILES_PER_UPLOAD,
                    error: error.message
                });
                return res.status(400).json({ 
                    error: `Za dużo plików naraz. Maksymalnie ${config.MAX_FILES_PER_UPLOAD} plików.`,
                    code: 'TOO_MANY_FILES'
                });
                
            case 'LIMIT_UNEXPECTED_FILE':
                logFileUpload('Upload failed - unexpected field', [], requestId, {
                    field: error.field,
                    error: error.message
                });
                return res.status(400).json({ 
                    error: 'Nieoczekiwane pole w formularzu.',
                    code: 'UNEXPECTED_FIELD'
                });
                
            default:
                logFileUpload('Upload failed - multer error', [], requestId, {
                    code: error.code,
                    error: error.message
                });
                return res.status(400).json({ 
                    error: 'Błąd podczas przesyłania pliku.',
                    code: error.code
                });
        }
    }
    
    // Handle file system errors
    if (error.code === 'ENOENT') {
        logActivity('ERROR', 'File not found', error.path, requestId);
        return res.status(404).json({ 
            error: 'Plik nie został znaleziony.',
            code: 'FILE_NOT_FOUND'
        });
    }
    
    if (error.code === 'ENOSPC') {
        logActivity('ERROR', 'Disk full', 'No space left on device', requestId);
        return res.status(507).json({ 
            error: 'Brak miejsca na dysku.',
            code: 'DISK_FULL'
        });
    }
    
    if (error.code === 'EMFILE' || error.code === 'ENFILE') {
        logActivity('ERROR', 'Too many open files', error.message, requestId);
        return res.status(503).json({ 
            error: 'Serwer jest przeciążony. Spróbuj ponownie za chwilę.',
            code: 'SERVER_OVERLOADED'
        });
    }
    
    // Handle timeout errors
    if (error.code === 'ETIMEDOUT') {
        logActivity('ERROR', 'Request timeout', error.message, requestId);
        return res.status(408).json({ 
            error: 'Przekroczono czas oczekiwania. Spróbuj ponownie.',
            code: 'TIMEOUT'
        });
    }
    
    // Log unknown errors with full details
    logActivity('ERROR', 'Unknown error', '', requestId, {
        name: error.name,
        message: error.message,
        code: error.code,
        syscall: error.syscall,
        path: error.path,
        stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
    });
    
    // Generic error response (don't expose internal details)
    res.status(500).json({ 
        error: 'Wystąpił błąd serwera. Spróbuj ponownie.',
        code: 'INTERNAL_ERROR',
        requestId: requestId
    });
};

// 🕐 Request timeout middleware
const timeoutMiddleware = (timeoutMs = config.UPLOAD_TIMEOUT) => {
    return (req, res, next) => {
        const requestId = req.requestId || 'no-id';
        
        // Set timeout for the request
        req.setTimeout(timeoutMs, () => {
            logActivity('ERROR', 'Request timeout', 
                `Request exceeded ${timeoutMs}ms timeout`, requestId);
            
            if (!res.headersSent) {
                res.status(408).json({
                    error: 'Przekroczono czas oczekiwania na przesłanie pliku.',
                    code: 'REQUEST_TIMEOUT'
                });
            }
        });
        
        // Set timeout for the response
        res.setTimeout(timeoutMs, () => {
            logActivity('ERROR', 'Response timeout', 
                `Response exceeded ${timeoutMs}ms timeout`, requestId);
        });
        
        next();
    };
};

// 📊 Memory usage monitoring middleware
const memoryMonitor = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    const beforeMemory = process.memoryUsage();
    
    res.on('finish', () => {
        const afterMemory = process.memoryUsage();
        const memoryDelta = {
            heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
            heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal,
            external: afterMemory.external - beforeMemory.external
        };
        
        // Log memory usage if significant
        if (Math.abs(memoryDelta.heapUsed) > 10 * 1024 * 1024) { // > 10MB change
            logActivity('DEBUG', 'Memory usage change', '', requestId, {
                heapUsedDelta: `${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`,
                currentHeapUsed: `${Math.round(afterMemory.heapUsed / 1024 / 1024)}MB`,
                currentHeapTotal: `${Math.round(afterMemory.heapTotal / 1024 / 1024)}MB`
            });
        }
    });
    
    next();
};

module.exports = {
    uploadLimiter,
    upload,
    debugUpload,
    securityMiddleware,
    protectFilesMiddleware,
    notFoundHandler,
    errorHandler,
    timeoutMiddleware,
    memoryMonitor
};