// Enhanced tunnel detection with detailed debugging
const detectTunnel = (req) => {
    console.log('🔍 FULL DEBUG - All Request Headers:');
    console.log(JSON.stringify(req.headers, null, 2));
    
    console.log('🔍 FULL DEBUG - Request Properties:');
    console.log({
        method: req.method,
        url: req.url,
        host: req.headers.host,
        'x-forwarded-proto': req.headers['x-forwarded-proto'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        secure: req.secure,
        encrypted: req.connection?.encrypted,
        protocol: req.protocol
    });
    
    // Check for any Cloudflare headers
    const allCloudflareHeaders = Object.keys(req.headers).filter(header => 
        header.toLowerCase().includes('cf-') || 
        header.toLowerCase().includes('cloudflare')
    );
    
    console.log('🔍 Cloudflare headers found:', allCloudflareHeaders);
    
    // Check for proxy headers
    const proxyHeaders = [
        'x-forwarded-proto',
        'x-forwarded-for', 
        'x-forwarded-host',
        'x-real-ip',
        'cf-ray',
        'cf-connecting-ip',
        'cf-ipcountry',
        'cf-visitor'
    ];
    
    const foundProxyHeaders = {};
    proxyHeaders.forEach(header => {
        if (req.headers[header]) {
            foundProxyHeaders[header] = req.headers[header];
        }
    });
    
    console.log('🔍 Proxy headers found:', foundProxyHeaders);
    
    // Multiple detection methods
    const detectionMethods = {
        hasCloudflareHeaders: Object.keys(req.headers).some(h => h.toLowerCase().startsWith('cf-')),
        hasXForwardedProto: !!req.headers['x-forwarded-proto'],
        isHTTPS: req.headers['x-forwarded-proto'] === 'https' || req.secure || req.connection?.encrypted,
        hasCloudflareRay: !!req.headers['cf-ray'],
        hasCloudflareIP: !!req.headers['cf-connecting-ip'],
        isTunnelDomain: (req.headers.host || '').includes('gosiaitomek.redirectme.net'),
        hasForwardedFor: !!req.headers['x-forwarded-for']
    };
    
    console.log('🔍 Detection Methods Results:', detectionMethods);
    
    // Determine if tunnel is active (be more lenient)
    const tunnelActive = 
        detectionMethods.hasCloudflareHeaders ||
        detectionMethods.hasCloudflareRay ||
        detectionMethods.hasCloudflareIP ||
        (detectionMethods.isTunnelDomain && detectionMethods.isHTTPS) ||
        (detectionMethods.isTunnelDomain && detectionMethods.hasXForwardedProto);
    
    console.log('🔍 FINAL TUNNEL DECISION:', {
        tunnelActive,
        reasoning: tunnelActive ? 'Found tunnel indicators' : 'No tunnel indicators found'
    });
    
    return {
        tunnelActive,
        isLocal: !tunnelActive,
        isTunnel: tunnelActive,
        debug: {
            detectionMethods,
            foundProxyHeaders,
            allCloudflareHeaders
        }
    };
};

module.exports = { detectTunnel };