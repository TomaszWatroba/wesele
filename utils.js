// utils.js - Enhanced logging and utilities
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 🎨 Color codes for console output
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

// 📊 Log levels for different types of messages
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

// 📋 Enhanced logging function with levels, colors, and structured output
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

// 🆔 Generate unique request ID for tracking requests
const generateRequestId = () => {
    return Math.random().toString(36).substr(2, 8);
};

// 🔍 Request logging middleware
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

// 🚨 Error logging with stack traces
const logError = (error, context = '', requestId = null) => {
    logActivity('ERROR', context || 'Unhandled error', error.message, requestId, {
        stack: error.stack,
        name: error.name,
        code: error.code
    });
};

// 📈 Performance logging
const performanceLogger = (operation) => {
    const start = Date.now();
    return {
        end: (details = '') => {
            const duration = Date.now() - start;
            logActivity('DEBUG', `Performance: ${operation}`, `${duration}ms ${details}`);
        }
    };
};

// 📊 File upload detailed logging
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

// 🛡️ Security event logging
const logSecurityEvent = (event, details, requestId, severity = 'WARN') => {
    logActivity('SECURITY', event, details, requestId, {
        severity,
        timestamp: new Date().toISOString()
    });
};

// 📁 Inicjalizacja folderów z logowaniem
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
            maxFileSize: `${config.MAX_FILE_SIZE / 1024 / 1024}MB`,
            maxFiles: config.MAX_FILES_PER_UPLOAD,
            eventName: config.EVENT_NAME
        });
        
    } catch (error) {
        logError(error, 'Failed to initialize directories');
        process.exit(1);
    }
};

// 🔍 Enhanced file type detection with logging
const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    logActivity('DEBUG', 'File type detection', `${filename} -> ${ext}`);
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', 
                       '.heics', '.heifs', '.avif', '.jfif', '.pjpeg', '.tiff', '.tif', '.bmp'];
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2', 
                       '.m4v', '.wmv', '.flv', '.ogv', '.quicktime'];
    
    if (imageExts.includes(ext)) {
        return 'image/' + ext.substring(1);
    } else if (videoExts.includes(ext)) {
        return 'video/' + ext.substring(1);
    }
    
    logActivity('WARN', 'Unknown file type', filename);
    return 'unknown';
};

// 📊 Enhanced file statistics with logging
const generateFileStats = (files) => {
    const perf = performanceLogger('generateFileStats');
    
    const photos = files.filter(f => f.type.startsWith('image')).length;
    const videos = files.filter(f => f.type.startsWith('video')).length;
    const totalSize = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024);
    
    const stats = { photos, videos, totalSize, totalFiles: files.length };
    
    perf.end(`processed ${files.length} files`);
    logActivity('DEBUG', 'File stats generated', '', null, stats);
    
    return stats;
};

// 📊 Enhanced log analysis
const analyzeActivityLogs = () => {
    const perf = performanceLogger('analyzeActivityLogs');
    
    try {
        if (!fs.existsSync(config.LOG_FILE)) {
            logActivity('WARN', 'Log file not found', config.LOG_FILE);
            return { uploads: 0, totalActivities: 0, recentLogs: [] };
        }
        
        const logs = fs.readFileSync(config.LOG_FILE, 'utf8');
        const logLines = logs.split('\n').filter(line => line.trim());
        
        const uploads = logLines.filter(line => 
            line.includes('UPLOAD') && line.includes('SUCCESS')
        ).length;
        
        const errors = logLines.filter(line => line.includes('[ERROR]')).length;
        const warnings = logLines.filter(line => line.includes('[WARN]')).length;
        
        const result = {
            uploads,
            errors,
            warnings,
            totalActivities: logLines.length,
            recentLogs: logLines.slice(-50).reverse()
        };
        
        perf.end(`analyzed ${logLines.length} log entries`);
        return result;
        
    } catch (error) {
        logError(error, 'Log analysis failed');
        return { uploads: 0, errors: 1, warnings: 0, totalActivities: 0, recentLogs: [] };
    }
};

// 🔧 Enhanced safe filename generation with logging
const generateSafeFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFilename = `${timestamp}_${randomString}_${safeOriginalName}`;
    
    logActivity('DEBUG', 'Filename generated', `${originalName} -> ${newFilename}`);
    return newFilename;
};

// 📂 Enhanced file listing with error handling
const getUploadedFiles = () => {
    const perf = performanceLogger('getUploadedFiles');
    
    try {
        const files = fs.readdirSync(config.UPLOADS_DIR).map(filename => {
            try {
                const filepath = path.join(config.UPLOADS_DIR, filename);
                const stats = fs.statSync(filepath);
                
                return {
                    name: filename,
                    size: stats.size,
                    created: stats.birthtime,
                    type: getFileType(filename)
                };
            } catch (error) {
                logError(error, `Failed to read file stats: ${filename}`);
                return null;
            }
        }).filter(Boolean).sort((a, b) => b.created - a.created);
        
        perf.end(`loaded ${files.length} files`);
        logActivity('DEBUG', 'Files loaded', `${files.length} files from ${config.UPLOADS_DIR}`);
        
        return files;
    } catch (error) {
        logError(error, 'Failed to read uploads directory');
        return [];
    }
};

// 🧹 Enhanced cleanup with detailed logging
const cleanupOldFiles = (daysOld = 30) => {
    const perf = performanceLogger('cleanupOldFiles');
    
    try {
        const files = fs.readdirSync(config.UPLOADS_DIR);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let deletedCount = 0;
        let deletedSize = 0;
        
        files.forEach(filename => {
            try {
                const filepath = path.join(config.UPLOADS_DIR, filename);
                const stats = fs.statSync(filepath);
                
                if (stats.birthtime < cutoffDate) {
                    deletedSize += stats.size;
                    fs.unlinkSync(filepath);
                    deletedCount++;
                    logActivity('INFO', 'File deleted', filename);
                }
            } catch (error) {
                logError(error, `Failed to delete file: ${filename}`);
            }
        });
        
        if (deletedCount > 0) {
            logActivity('SUCCESS', 'Cleanup completed', '', null, {
                deletedFiles: deletedCount,
                deletedSize: `${Math.round(deletedSize / 1024 / 1024)}MB`,
                daysOld
            });
        } else {
            logActivity('INFO', 'Cleanup completed', 'No files to delete');
        }
        
        perf.end(`processed ${files.length} files, deleted ${deletedCount}`);
        return deletedCount;
        
    } catch (error) {
        logError(error, 'Cleanup failed');
        return 0;
    }
};

// 📊 System health check with logging
const getSystemHealth = () => {
    const memory = process.memoryUsage();
    const uptime = Math.floor(process.uptime());
    
    const health = {
        status: 'healthy',
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memory: {
            used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
        },
        nodeVersion: process.version,
        platform: process.platform
    };
    
    logActivity('DEBUG', 'System health checked', '', null, health);
    return health;
};

module.exports = {
    // Enhanced logging functions
    logActivity,
    logError,
    logFileUpload,
    logSecurityEvent,
    requestLogger,
    performanceLogger,
    generateRequestId,
    
    // Existing functions with enhanced logging
    initializeDirectories,
    getFileType,
    generateFileStats,
    analyzeActivityLogs,
    generateSafeFilename,
    getUploadedFiles,
    cleanupOldFiles,
    
    // New functions
    getSystemHealth,
    
    // Log levels for external use
    LOG_LEVELS
};