// server.js - Main Entry Point (Simplified)
const express = require('express');
const session = require('express-session');
require('dotenv').config();

// Import configurations
const config = require('./config/base-config');
const { initializeApp } = require('./config/server-config');

// Import utilities
const { logActivity, logError, initializeDirectories } = require('./utils/logging');

// Import middleware
const { 
    securityMiddleware, 
    requestLogger, 
    memoryMonitor,
    errorHandler,
    notFoundHandler
} = require('./middleware');

// Import routes
const mainRoutes = require('./routes/main-routes');
const adminRoutes = require('./routes/admin-routes');
const apiRoutes = require('./api-routes');

const app = express();

// Initialize directories and logging
try {
    initializeDirectories();
    logActivity('SUCCESS', 'Wedding website directories initialized');
} catch (error) {
    logError(error, 'Failed to initialize directories');
    process.exit(1);
}

// Basic middleware
app.use(requestLogger);
app.use(memoryMonitor);
app.use(securityMiddleware);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
    secret: config.ADMIN_SESSION_SECRET || 'wedding-secret-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static(config.UPLOADS_DIR));

// Routes
app.use('/', mainRoutes);
app.use('/admin', adminRoutes);
app.use('/api', apiRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.PORT, () => {
    const startupMessage = `
🎉 WEDDING WEBSITE STARTED!
👰‍♀️ ${config.COUPLE_NAMES.bride} & 🤵‍♂️ ${config.COUPLE_NAMES.groom}
🌐 Domain: ${config.DOMAIN}
📅 Wedding Date: ${new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL')}
🔗 Server: http://localhost:${config.PORT}
    `;
    
    console.log(startupMessage);
    logActivity('SUCCESS', 'Wedding website started', '', null, {
        port: config.PORT,
        domain: config.DOMAIN
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logActivity('INFO', 'Shutdown initiated', `Received ${signal}`);
    server.close((err) => {
        if (err) {
            logError(err, 'Error during server shutdown');
        } else {
            logActivity('SUCCESS', 'Wedding website closed gracefully');
        }
        process.exit(0);
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { app, server };