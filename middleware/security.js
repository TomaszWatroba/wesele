// middleware/security.js - Security and rate limiting middleware
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { logActivity, logSecurityEvent } = require('../utils');

// 🚫 Enhanced rate limiting with detailed logging
const uploadLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_UPLOADS,
    message: {
        error: 'Chwilę pauzy - za dużo przesłań naraz. Spróbuj za chwilę 😊'
    },
    standardHeaders: false,
    legacyHeaders: false,
    
    // Enhanced logging for rate limiting handled in handler below
    
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

// 🛡️ Enhanced security middleware with detailed logging
const securityMiddleware = (req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    // Log incoming requests
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

// 📷 File protection middleware
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

module.exports = {
    uploadLimiter,
    securityMiddleware,
    protectFilesMiddleware
};