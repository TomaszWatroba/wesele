// config/server-config.js - Server initialization and configuration
const path = require('path');
const fs = require('fs');
const config = require('./base-config');

// Initialize application directories and settings
const initializeApp = () => {
    // Create required directories
    const directories = [
        config.UPLOADS_DIR,
        path.join(config.UPLOADS_DIR, 'thumbnails'),
        path.join(__dirname, '../data'),
        path.join(__dirname, '../views'),
        path.join(__dirname, '../public')
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    });
    
    // Initialize gallery data file if it doesn't exist
    const galleryFile = path.join(__dirname, '../data/gallery.json');
    if (!fs.existsSync(galleryFile)) {
        fs.writeFileSync(galleryFile, '[]', 'utf8');
        console.log('✅ Created empty gallery.json');
    }
    
    // Initialize log file
    if (!fs.existsSync(config.LOG_FILE)) {
        const logDir = path.dirname(config.LOG_FILE);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.writeFileSync(config.LOG_FILE, '', 'utf8');
        console.log('✅ Created log file');
    }
    
    console.log('🎉 Application initialized successfully!');
};

// Server timeout configuration
const TIMEOUT_CONFIG = {
    // Standard requests: 30 seconds
    standard: 30000,
    // Upload requests: 5 minutes
    upload: 300000,
    // Admin requests: 1 minute
    admin: 60000
};

// Server security headers
const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Server': 'Wedding-Website'
};

// CORS configuration for wedding website
const CORS_CONFIG = {
    origin: function(origin, callback) {
        // Allow requests with no origin (mobile apps, etc.)
        if (!origin) return callback(null, true);
        
        // Allow custom domain
        if (origin.includes(config.CUSTOM_DOMAIN)) {
            return callback(null, true);
        }
        
        // Allow localhost for development
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true);
        }
        
        // Allow tunnel domains
        if (origin.includes('cloudflare') || origin.includes('ngrok')) {
            return callback(null, true);
        }
        
        // Reject other origins
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Zbyt wiele żądań, spróbuj ponownie za chwilę.'
    },
    standardHeaders: true,
    legacyHeaders: false
};

module.exports = {
    initializeApp,
    TIMEOUT_CONFIG,
    SECURITY_HEADERS,
    CORS_CONFIG,
    RATE_LIMIT_CONFIG
};