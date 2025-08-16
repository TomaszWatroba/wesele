// middleware/upload.js - File upload handling with multer
const multer = require('multer');
const config = require('../config');
const { 
    logActivity, 
    logFileUpload, 
    logSecurityEvent, 
    generateSafeFilename,
    performanceLogger 
} = require('../utils');

// 📦 Enhanced multer storage configuration
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

// 🔍 File validation with detailed logging
const fileFilter = (req, file, cb) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('DEBUG', 'File validation started', '', requestId, {
        filename: file.originalname,
        mimetype: file.mimetype || 'empty',
        fieldname: file.fieldname,
        encoding: file.encoding
    });
    
    const fileName = file.originalname.toLowerCase();
    const mimeType = file.mimetype || '';
    
    // Security: Block dangerous extensions
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
    
    // File size check
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
    
    // Accept file
    logActivity('SUCCESS', 'File validation passed', 
        `${file.originalname} (${mimeType || 'no MIME'})`, requestId);
    logFileUpload('File accepted', [file], requestId, {
        mimetype: mimeType,
        size: file.size
    });
    
    cb(null, true);
};

// 📤 Multer upload configuration
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: config.MAX_FILES_PER_UPLOAD,
        fieldSize: 10 * 1024 * 1024, // 10MB field size limit
        fields: 10 // Max number of non-file fields
    },
    fileFilter: fileFilter
});

// 🔍 Upload request debug middleware
const debugUpload = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('DEBUG', 'Upload request analysis', '', requestId, {
        contentType: req.get('Content-Type'),
        contentLength: req.get('Content-Length'),
        userAgent: req.get('User-Agent'),
        hasMultipart: !!(req.get('Content-Type') && req.get('Content-Type').includes('multipart/form-data')),
        ip: req.ip || req.connection.remoteAddress
    });
    
    // Check multipart header
    if (!req.get('Content-Type') || !req.get('Content-Type').includes('multipart/form-data')) {
        logActivity('ERROR', 'Missing multipart header', 
            'Request missing multipart/form-data Content-Type', requestId);
    }
    
    next();
};

module.exports = {
    upload,
    debugUpload
};