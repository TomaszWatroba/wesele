const config = require('../config');
const { logActivity } = require('../utils');

// 🕐 Fixed Request timeout middleware
const timeoutMiddleware = (timeoutMs) => {
    return (req, res, next) => {
        const requestId = req.requestId || 'no-id';
        
        // Use default timeout if not provided or invalid
        const timeout = timeoutMs && typeof timeoutMs === 'number' ? timeoutMs : 30000; // 30 seconds default
        
        // Set timeout for the request
        req.setTimeout(timeout, () => {
            logActivity('ERROR', 'Request timeout', 
                `Request exceeded ${timeout}ms timeout`, requestId);
            
            if (!res.headersSent) {
                res.status(408).json({
                    error: 'Przekroczono czas oczekiwania na przesłanie pliku.',
                    code: 'REQUEST_TIMEOUT'
                });
            }
        });
        
        // Set timeout for the response
        res.setTimeout(timeout, () => {
            logActivity('ERROR', 'Response timeout', 
                `Response exceeded ${timeout}ms timeout`, requestId);
        });
        
        next();
    };
};

// 📊 Memory usage monitoring middleware
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
            // Silently handle memory monitoring errors
            logActivity('DEBUG', 'Memory monitoring error', error.message, requestId);
        }
    });
    
    next();
};

// 📈 Request performance monitoring
const performanceMonitor = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
        try {
            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
            
            // Log slow requests (> 1 second)
            if (duration > 1000) {
                logActivity('WARN', 'Slow request detected', '', requestId, {
                    method: req.method,
                    path: req.path,
                    duration: `${Math.round(duration)}ms`,
                    statusCode: res.statusCode
                });
            }
            
            // Log very slow requests (> 5 seconds)
            if (duration > 5000) {
                logActivity('ERROR', 'Very slow request', '', requestId, {
                    method: req.method,
                    path: req.path,
                    duration: `${Math.round(duration)}ms`,
                    statusCode: res.statusCode,
                    contentLength: req.get('Content-Length'),
                    userAgent: req.get('User-Agent')
                });
            }
        } catch (error) {
            // Silently handle performance monitoring errors
            logActivity('DEBUG', 'Performance monitoring error', error.message, requestId);
        }
    });
    
    next();
};

// 🏥 Health monitoring middleware
const healthMonitor = (req, res, next) => {
    try {
        // Check system health periodically
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
        if (uptime > 24 * 60 * 60 && uptime % (60 * 60) < 5) { // Log once per hour after 24h
            logActivity('INFO', 'Long running server', '', req.requestId, {
                uptime: `${Math.round(uptime / 3600)}h`,
                memoryUsed: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
                status: 'healthy'
            });
        }
    } catch (error) {
        // Silently handle health monitoring errors
        logActivity('DEBUG', 'Health monitoring error', error.message, req.requestId);
    }
    
    next();
};

module.exports = {
    timeoutMiddleware,
    memoryMonitor,
    performanceMonitor,
    healthMonitor
};