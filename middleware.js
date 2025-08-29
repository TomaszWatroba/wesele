// middleware.js - Custom middleware functions
const { logActivity, logError } = require('./utils/logging');
const { v4: uuidv4 } = require('uuid');

// Request logger middleware
const requestLogger = (req, res, next) => {
    req.requestId = uuidv4();
    const startTime = Date.now();
    
    // Log request
    logActivity('INFO', `${req.method} ${req.url}`, '', req.requestId);
    
    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logActivity('INFO', `${req.method} ${req.url} - ${res.statusCode}`, 
            `${duration}ms`, req.requestId);
    });
    
    next();
};

// Memory monitor middleware
const memoryMonitor = (req, res, next) => {
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Log memory usage if it's high
    if (memUsageMB > 100) {
        logActivity('WARN', 'High memory usage detected', `${memUsageMB}MB`, req.requestId);
    }
    
    next();
};

// Security middleware
const securityMiddleware = (req, res, next) => {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    logError(err, 'Unhandled error', req.requestId);
    
    if (res.headersSent) {
        return next(err);
    }
    
    res.status(500).json({
        error: 'Internal server error',
        requestId: req.requestId
    });
};

// Not found handler middleware
const notFoundHandler = (req, res) => {
    logActivity('WARN', `404 - Not found: ${req.method} ${req.url}`, '', req.requestId);
    res.status(404).json({
        error: 'Not found',
        requestId: req.requestId
    });
};

module.exports = {
    requestLogger,
    memoryMonitor,
    securityMiddleware,
    errorHandler,
    notFoundHandler
};