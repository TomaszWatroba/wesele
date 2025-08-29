// utils/system-health.js - System health monitoring utilities
const fs = require('fs');
const path = require('path');
const config = require('../config/base-config');
const { logActivity, logError } = require('./logging');

// System health check with logging
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

// Enhanced log analysis
const analyzeActivityLogs = () => {
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
        
        logActivity('DEBUG', 'Log analysis completed', `analyzed ${logLines.length} log entries`);
        return result;
        
    } catch (error) {
        logError(error, 'Log analysis failed');
        return { uploads: 0, errors: 1, warnings: 0, totalActivities: 0, recentLogs: [] };
    }
};

// Memory monitoring middleware
const memoryMonitor = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    const beforeMemory = process.memoryUsage();
    
    res.on('finish', () => {
        try {
            const afterMemory = process.memoryUsage();
            const memoryDelta = {
                heapUsed: afterMemory.heapUsed - beforeMemory.heapUsed,
                heapTotal: afterMemory.heapTotal - beforeMemory.heapTotal,
                external: afterMemory.external - beforeMemory.external
            };
            
            // Log memory usage if significant change (> 10MB)
            if (Math.abs(memoryDelta.heapUsed) > 10 * 1024 * 1024) {
                logActivity('DEBUG', 'Memory usage change', '', requestId, {
                    heapUsedDelta: `${Math.round(memoryDelta.heapUsed / 1024 / 1024)}MB`,
                    currentHeapUsed: `${Math.round(afterMemory.heapUsed / 1024 / 1024)}MB`,
                    currentHeapTotal: `${Math.round(afterMemory.heapTotal / 1024 / 1024)}MB`
                });
            }
        } catch (error) {
            logActivity('DEBUG', 'Memory monitoring error', error.message, requestId);
        }
    });
    
    next();
};

// Performance logger
const performanceLogger = (operation) => {
    const start = Date.now();
    return {
        end: (details = '') => {
            const duration = Date.now() - start;
            logActivity('DEBUG', `Performance: ${operation}`, `${duration}ms ${details}`);
        }
    };
};

// Health monitoring middleware
const healthMonitor = (req, res, next) => {
    try {
        const memory = process.memoryUsage();
        const uptime = process.uptime();
        
        // Warn if memory usage is high (> 512MB)
        if (memory.heapUsed > 512 * 1024 * 1024) {
            logActivity('WARN', 'High memory usage detected', '', req.requestId, {
                heapUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`,
                uptime: `${Math.round(uptime)}s`
            });
        }
        
        // Log if server has been running for a long time (> 24 hours)
        if (uptime > 24 * 60 * 60 && uptime % (60 * 60) < 5) {
            logActivity('INFO', 'Long running server', '', req.requestId, {
                uptime: `${Math.round(uptime / 3600)}h`,
                memoryUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
                status: 'healthy'
            });
        }
    } catch (error) {
        logActivity('DEBUG', 'Health monitoring error', error.message, req.requestId);
    }
    
    next();
};

// Check disk space
const checkDiskSpace = () => {
    try {
        const stats = fs.statSync(config.UPLOADS_DIR);
        
        // This is a basic check - in production you might want to use a library
        // like 'check-disk-space' for more accurate disk space monitoring
        
        logActivity('DEBUG', 'Disk space check completed', config.UPLOADS_DIR);
        
        return {
            uploadsDir: config.UPLOADS_DIR,
            accessible: true,
            lastModified: stats.mtime
        };
    } catch (error) {
        logError(error, 'Disk space check failed');
        return {
            uploadsDir: config.UPLOADS_DIR,
            accessible: false,
            error: error.message
        };
    }
};

module.exports = {
    getSystemHealth,
    analyzeActivityLogs,
    memoryMonitor,
    performanceLogger,
    healthMonitor,
    checkDiskSpace
};