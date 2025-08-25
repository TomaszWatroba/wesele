// utils/url-detection.js - Dedicated URL and tunnel detection module
const config = require('../config');
const { logActivity } = require('../utils');

// Enhanced tunnel detection with custom domain support
const detectTunnel = (req) => {
    const requestId = req.requestId || 'no-id';
    const hostHeader = req.headers.host || '';
    const customDomain = config.CUSTOM_DOMAIN;
    const forceTunnel = process.env.FORCE_TUNNEL === 'true';
    
    // Log headers for debugging
    logActivity('DEBUG', 'URL Detection - Request Headers', '', requestId, {
        host: hostHeader,
        'cf-visitor': req.headers['cf-visitor'],
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'cf-ray': req.headers['cf-ray'],
        'cf-connecting-ip': req.headers['cf-connecting-ip'],
        'user-agent': req.headers['user-agent']
    });
    
    // Detection methods
    const detectionMethods = {
        hasCloudflareHeaders: Object.keys(req.headers).some(h => h.toLowerCase().startsWith('cf-')),
        hasXForwardedProto: !!req.headers['x-forwarded-proto'],
        isHTTPS: req.headers['x-forwarded-proto'] === 'https' || req.secure || req.connection?.encrypted,
        hasCloudflareRay: !!req.headers['cf-ray'],
        hasCloudflareIP: !!req.headers['cf-connecting-ip'],
        isCustomDomain: hostHeader.includes(customDomain),
        isTunnelDomain: hostHeader.includes('gosiaitomek.redirectme.net'),
        isQuickTunnel: hostHeader.includes('trycloudflare.com'),
        forceTunnel: forceTunnel
    };
    
    // Log detection methods for debugging
    logActivity('DEBUG', 'URL Detection - Methods', '', requestId, detectionMethods);
    
    // Determine if tunnel or custom domain is active
    const tunnelActive = 
        detectionMethods.forceTunnel ||
        detectionMethods.isCustomDomain ||
        detectionMethods.hasCloudflareHeaders ||
        detectionMethods.hasCloudflareRay ||
        detectionMethods.hasCloudflareIP ||
        detectionMethods.isQuickTunnel ||
        (detectionMethods.isTunnelDomain && detectionMethods.isHTTPS) ||
        (detectionMethods.isTunnelDomain && detectionMethods.hasXForwardedProto);
    
    // Determine detection reason
    let detectionReason = 'Local connection';
    if (detectionMethods.forceTunnel) {
        detectionReason = 'Force tunnel environment variable';
    } else if (detectionMethods.isCustomDomain) {
        detectionReason = 'Custom domain detected';
    } else if (detectionMethods.hasCloudflareHeaders || detectionMethods.hasCloudflareRay) {
        detectionReason = 'Cloudflare headers detected';
    } else if (detectionMethods.isQuickTunnel) {
        detectionReason = 'Cloudflare quick tunnel detected';
    }
    
    // Log final decision
    logActivity('INFO', 'URL Detection - Result', detectionReason, requestId, {
        tunnelActive,
        customDomain,
        hostHeader
    });
    
    return {
        tunnelActive,
        isLocal: !tunnelActive,
        isTunnel: tunnelActive,
        customDomain: customDomain,
        detectionReason,
        hostHeader
    };
};

// Function to get the best URL for QR codes and public access
const getBestPublicURL = (req, path = '') => {
    const requestId = req.requestId || 'no-id';
    const tunnelInfo = detectTunnel(req);
    const customDomain = config.CUSTOM_DOMAIN;
    
    let baseURL;
    
    if (tunnelInfo.tunnelActive) {
        // Prefer custom domain if available
        baseURL = `https://${customDomain}`;
        logActivity('DEBUG', 'URL Generation - Using custom domain', baseURL, requestId);
    } else {
        // No tunnel - use localhost
        baseURL = `http://localhost:${config.PORT}`;
        logActivity('DEBUG', 'URL Generation - Using localhost', baseURL, requestId);
    }
    
    // Add path if provided
    if (path) {
        // Make sure path starts with a slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        
        const fullURL = baseURL + path;
        logActivity('DEBUG', 'URL Generation - Full URL', fullURL, requestId);
        return fullURL;
    }
    
    logActivity('DEBUG', 'URL Generation - Base URL', baseURL, requestId);
    return baseURL;
};

module.exports = {
    detectTunnel,
    getBestPublicURL
};