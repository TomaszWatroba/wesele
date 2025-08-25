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
    const clientIP = req.get('X-Forwarded-For') || req.ip || 'unknown';
    
    // Log incoming requests with more detail
    logActivity('DEBUG', 'Security check', `${req.method} ${req.path}`, requestId, {
        userAgent: req.get('User-Agent'),
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        xForwardedFor: req.get('X-Forwarded-For'),
        realIP: clientIP
    });
    
    // LEGITIMATE ROUTES - Allow these paths to pass through
    const legitimateRoutes = [
        '/admin',           // Your admin panel
        '/admin/',          // Your admin panel with trailing slash
        '/admin/login',     // Admin login page
        '/admin/logout',    // Admin logout
        '/api/',            // Your API routes
        '/upload',          // Upload page for guests
        '/photos',          // Photos page
        '/menu',            // Menu page
        '/drinks',          // Drinks page
        '/seating',         // Seating page
        '/story',           // Story page
        '/health',          // Health check
        '/qr',              // QR generation
        '/gallery'          // Gallery page
    ];
    
    // Check if this is a legitimate route
    const isLegitimateRoute = legitimateRoutes.some(route => 
        req.path === route || req.path.startsWith(route)
    );
    
    if (isLegitimateRoute) {
        logActivity('DEBUG', 'Legitimate route access', `Allowing access to ${req.path}`, requestId);
        // Add security headers and continue
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('Server', 'Wedding-Website');
        
        logActivity('DEBUG', 'Security check passed', '', requestId);
        return next();
    }
    
    // ATTACK PATTERN DETECTION - Only for non-legitimate routes
    const attackPatterns = [
        // WordPress scanning
        /wp-/i,
        /wordpress/i,
        /wp-admin/i,
        /wp-content/i,
        /wp-includes/i,
        
        // Common attack paths (but exclude our legitimate /admin)
        /\.php/i,
        /\.asp/i,
        /\.jsp/i,
        /phpmyadmin/i,
        /xmlrpc\.php/i,
        
        // Suspicious attack tools
        /golden-access/i,
        /shell/i,
        /backdoor/i,
        /exploit/i,
        
        // Directory traversal
        /\.\./,
        /\/\./,
        
        // Script injection
        /\<script\>/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        
        // Common scanner patterns
        /\.env/i,
        /config\.php/i,
        /database/i,
        /backup/i,
        /\.git/i,
        /\.svn/i
    ];
    
    const isAttackPattern = attackPatterns.some(pattern => 
        pattern.test(req.url) || pattern.test(req.path)
    );
    
    if (isAttackPattern) {
        logSecurityEvent('Attack pattern detected', 
            `Blocked suspicious request from ${clientIP}: ${req.method} ${req.url}`, 
            requestId, 'WARN');
        
        // Return 404 instead of revealing we blocked it
        return res.status(404).send('Not Found');
    }
    
    // Block dangerous HTTP methods
    const allowedMethods = ['GET', 'POST', 'OPTIONS'];
    if (!allowedMethods.includes(req.method)) {
        logSecurityEvent('Blocked HTTP method', 
            `Blocked ${req.method} from ${clientIP} to ${req.path}`, requestId, 'ERROR');
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Server', 'Wedding-Website');
    
    // CORS handling
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