// middleware/error.js - Error handling and 404 middleware
const multer = require('multer');
const config = require('../config');
const { logActivity, logError, logFileUpload } = require('../utils');

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

module.exports = {
    notFoundHandler,
    errorHandler
};