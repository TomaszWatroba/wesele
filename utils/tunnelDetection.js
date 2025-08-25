// Enhanced tunnel and URL detection with custom domain support
const config = require('./config');

// Function to detect tunnel and custom domain
const detectTunnel = (req) => {
    console.log('🔍 FULL DEBUG - All Request Headers:');
    console.log(JSON.stringify(req.headers, null, 2));
    
    const hostHeader = req.headers.host || '';
    const customDomain = config.CUSTOM_DOMAIN;
    
    // Multiple detection methods
    const detectionMethods = {
        hasCloudflareHeaders: Object.keys(req.headers).some(h => h.toLowerCase().startsWith('cf-')),
        hasXForwardedProto: !!req.headers['x-forwarded-proto'],
        isHTTPS: req.headers['x-forwarded-proto'] === 'https' || req.secure || req.connection?.encrypted,
        hasCloudflareRay: !!req.headers['cf-ray'],
        hasCloudflareIP: !!req.headers['cf-connecting-ip'],
        isCustomDomain: hostHeader.includes(customDomain),
        isTunnelDomain: hostHeader.includes('gosiaitomek.redirectme.net'),
        isQuickTunnel: hostHeader.includes('trycloudflare.com'),
        hasForwardedFor: !!req.headers['x-forwarded-for'],
        forceTunnel: process.env.FORCE_TUNNEL === 'true'
    };
    
    console.log('🔍 Detection Methods Results:', detectionMethods);
    
    // Determine if tunnel is active
    const tunnelActive = 
        detectionMethods.forceTunnel ||
        detectionMethods.isCustomDomain ||
        detectionMethods.hasCloudflareHeaders ||
        detectionMethods.hasCloudflareRay ||
        detectionMethods.hasCloudflareIP ||
        detectionMethods.isQuickTunnel ||
        (detectionMethods.isTunnelDomain && detectionMethods.isHTTPS) ||
        (detectionMethods.isTunnelDomain && detectionMethods.hasXForwardedProto);
    
    console.log('🔍 FINAL TUNNEL DECISION:', {
        tunnelActive,
        customDomain: customDomain,
        reasoning: tunnelActive ? 'Found tunnel indicators or custom domain' : 'No tunnel indicators found'
    });
    
    return {
        tunnelActive,
        isLocal: !tunnelActive,
        isTunnel: tunnelActive,
        customDomain: customDomain,
        debug: {
            detectionMethods,
            hostHeader
        }
    };
};

// Function to get the best URL for QR codes and public access
const getBestPublicURL = (req, path = '') => {
    const tunnelInfo = detectTunnel(req);
    const customDomain = config.CUSTOM_DOMAIN;
    
    let baseURL;
    
    if (tunnelInfo.tunnelActive) {
        // If we have a custom domain, use it
        baseURL = `https://${customDomain}`;
    } else {
        // No tunnel - use localhost
        baseURL = `http://localhost:${config.PORT}`;
    }
    
    // Add path if provided
    if (path) {
        // Make sure path starts with a slash
        if (!path.startsWith('/')) {
            path = '/' + path;
        }
        return baseURL + path;
    }
    
    return baseURL;
};

module.exports = {
    detectTunnel,
    getBestPublicURL
};