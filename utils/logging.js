// utils/logging.js - Enhanced logging utilities
const fs = require('fs');
const path = require('path');
const config = require('../config/base-config');

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};

// Log levels for different types of messages
const LOG_LEVELS = {
    ERROR: { level: 0, color: colors.red, prefix: '❌ ERROR' },
    WARN: { level: 1, color: colors.yellow, prefix: '⚠️  WARN' },
    INFO: { level: 2, color: colors.blue, prefix: '📋 INFO' },
    SUCCESS: { level: 3, color: colors.green, prefix: '✅ SUCCESS' },
    DEBUG: { level: 4, color: colors.gray, prefix: '🔍 DEBUG' },
    REQUEST: { level: 2, color: colors.cyan, prefix: '🌐 REQUEST' },
    UPLOAD: { level: 2, color: colors.magenta, prefix: '📤 UPLOAD' },
    SECURITY: { level: 1, color: colors.red, prefix: '🛡️  SECURITY' }
};

// Current log level (set to DEBUG for development, INFO for production)
const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production' ? 2 : 4;

// Enhanced logging function with levels, colors, and structured output
const logActivity = (level, action, details = '', requestId = null, extra = {}) => {
    const logConfig = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    
    // Skip if log level is below threshold
    if (logConfig.level > CURRENT_LOG_LEVEL) return;
    
    const timestamp = new Date().toLocaleString('pl-PL');
    const reqId = requestId ? `[${requestId}] ` : '';
    
    // Console output with colors
    const colorizedMessage = `${logConfig.color}${logConfig.prefix}${colors.reset} ${colors.gray}[${timestamp}]${colors.reset} ${reqId}${action}${details ? ' - ' + details : ''}`;
    console.log(colorizedMessage);
    
    // File output (plain text)
    const fileMessage = `[${timestamp}] [${level}] ${reqId}${action}${details ? ' - ' + details : ''}`;
    
    // Add extra details if provided
    if (Object.keys(extra).length > 0) {
        const extraStr = JSON.stringify(extra, null, 2).replace(/\n/g, '\n    ');
        console.log(`${colors.gray}    Extra data: ${extraStr}${colors.reset}`);
        
        const fileExtra = `    Extra: ${JSON.stringify(extra)}`;
        fs.appendFileSync(config.LOG_FILE, fileMessage + '\n' + fileExtra + '\n', { flag: 'a' });
    } else {
        fs.appendFileSync(config.LOG_FILE, fileMessage + '\n', { flag: 'a' });
    }
};

// Error logging with stack traces
const logError = (error, context = '', requestId = null) => {
    logActivity('ERROR', context || 'Unhandled error', error.message, requestId, {
        stack: error.stack,
        name: error.name,
        code: error.code
    });
};

// File upload detailed logging
const logFileUpload = (action, files, requestId, extra = {}) => {
    if (files && files.length > 0) {
        const fileDetails = files.map(f => ({
            original: f.originalname,
            size: `${Math.round(f.size / 1024)}KB`,
            type: f.mimetype,
            saved: f.filename
        }));
        
        logActivity('UPLOAD', action, '', requestId, {
            fileCount: files.length,
            totalSize: `${Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024 * 100) / 100}MB`,
            files: fileDetails,
            ...extra
        });
    } else {
        logActivity('UPLOAD', action, 'No files', requestId, extra);
    }
};

// Security event logging
const logSecurityEvent = (event, details, requestId, severity = 'WARN') => {
    logActivity('SECURITY', event, details, requestId, {
        severity,
        timestamp: new Date().toISOString()
    });
};

// Generate unique request ID for tracking requests
const generateRequestId = () => {
    return Math.random().toString(36).substr(2, 8);
};

// Request logging middleware
const requestLogger = (req, res, next) => {
    const requestId = generateRequestId();
    req.requestId = requestId;
    
    const startTime = Date.now();
    
    // Log request start
    logActivity('REQUEST', 'Started', '', requestId, {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length')
    });
    
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const duration = Date.now() - startTime;
        
        logActivity('REQUEST', 'Completed', '', requestId, {
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            responseSize: res.get('Content-Length') || (chunk ? chunk.length : 0)
        });
        
        originalEnd.call(res, chunk, encoding);
    };
    
    next();
};

// Initialize directories with logging
const initializeDirectories = () => {
    try {
        if (!fs.existsSync(config.UPLOADS_DIR)) {
            fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
            logActivity('SUCCESS', 'Directory created', config.UPLOADS_DIR);
        } else {
            logActivity('INFO', 'Directory exists', config.UPLOADS_DIR);
        }
        
        // Create logs directory if needed
        const logDir = path.dirname(config.LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
            logActivity('SUCCESS', 'Log directory created', logDir);
        }
        
        // Log startup info
        logActivity('INFO', 'App initialization completed', '', null, {
            uploadsDir: config.UPLOADS_DIR,
            logFile: config.LOG_FILE,
            eventName: config.EVENT_NAME
        });
        
    } catch (error) {
        logError(error, 'Failed to initialize directories');
        process.exit(1);
    }
};

module.exports = {
    logActivity,
    logError,
    logFileUpload,
    logSecurityEvent,
    requestLogger,
    generateRequestId,
    initializeDirectories,
    LOG_LEVELS
};