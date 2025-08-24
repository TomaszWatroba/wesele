// api-routes.js - Enhanced API endpoints with comprehensive logging
const express = require('express');
const QRCode = require('qrcode');
const archiver = require('archiver');
const config = require('./config');
const { 
    logActivity, 
    logError, 
    logFileUpload, 
    getUploadedFiles, 
    analyzeActivityLogs,
    performanceLogger
} = require('./utils');
const { uploadLimiter, upload, debugUpload } = require('./middleware');

const router = express.Router();


const detectTunnel = (req) => {
    console.log('🔍 FULL DEBUG - All Request Headers:');
    console.log(JSON.stringify(req.headers, null, 2));
    
    const hostHeader = req.headers.host || '';
    
    // Multiple detection methods
    const detectionMethods = {
        hasCloudflareHeaders: Object.keys(req.headers).some(h => h.toLowerCase().startsWith('cf-')),
        hasXForwardedProto: !!req.headers['x-forwarded-proto'],
        isHTTPS: req.headers['x-forwarded-proto'] === 'https' || req.secure || req.connection?.encrypted,
        hasCloudflareRay: !!req.headers['cf-ray'],
        hasCloudflareIP: !!req.headers['cf-connecting-ip'],
        isTunnelDomain: hostHeader.includes('gosiaitomek.redirectme.net'),
        isQuickTunnel: hostHeader.includes('trycloudflare.com'), // Detect quick tunnels
        hasForwardedFor: !!req.headers['x-forwarded-for']
    };
    
    console.log('🔍 Detection Methods Results:', detectionMethods);
    
    // Determine if tunnel is active
    const tunnelActive = 
        detectionMethods.hasCloudflareHeaders ||
        detectionMethods.hasCloudflareRay ||
        detectionMethods.hasCloudflareIP ||
        detectionMethods.isQuickTunnel || // Add quick tunnel detection
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
            hostHeader
        }
    };
};
module.exports = { detectTunnel };

// 📤 Enhanced file upload endpoint with detailed logging
router.post('/upload', (req, res, next) => {
    console.log('🚨 UPLOAD ROUTE HIT!');
    next();
}, uploadLimiter, debugUpload, upload.array('photos'), (req, res) => {
    const requestId = req.requestId;
    const uploadPerf = performanceLogger('fileUpload');
    
    logActivity('INFO', 'Upload endpoint reached', '', requestId, {
        filesReceived: req.files ? req.files.length : 0,
        bodyKeys: Object.keys(req.body || {}),
        contentLength: req.get('Content-Length'),
        userAgent: req.get('User-Agent')
    });
    
    // Validate files were received
    if (!req.files || req.files.length === 0) {
        logFileUpload('Upload failed - no files', [], requestId, {
            reason: 'No files in request',
            multerError: 'Files likely rejected by multer validation'
        });
        return res.status(400).json({ 
            error: 'Nie przesłano żadnych plików lub zostały odrzucone',
            code: 'NO_FILES'
        });
    }
    
    // Calculate total upload size
    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
    const fileSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
    
    // Log successful upload with details
    logFileUpload('Upload successful', req.files, requestId, {
        totalSizeMB: fileSizeMB,
        averageFileSize: `${Math.round(totalSize / req.files.length / 1024)}KB`,
        uploadDuration: uploadPerf.end(`${req.files.length} files, ${fileSizeMB}MB`)
    });
    
    // Log individual file details
    req.files.forEach((file, index) => {
        logActivity('DEBUG', 'File saved', '', requestId, {
            index: index + 1,
            originalName: file.originalname,
            savedAs: file.filename,
            size: `${Math.round(file.size / 1024)}KB`,
            mimetype: file.mimetype,
            destination: file.destination
        });
    });
    
    // Success response
    const response = { 
        message: 'Pliki przesłane pomyślnie', 
        files: req.files.map(f => ({
            original: f.originalname,
            saved: f.filename,
            size: f.size,
            type: f.mimetype
        })),
        count: req.files.length,
        totalSizeMB: fileSizeMB,
        uploadId: requestId
    };
    
    logActivity('SUCCESS', 'Upload response sent', '', requestId, {
        responseSize: JSON.stringify(response).length
    });
    
    res.json(response);
});

// 📊 Enhanced files list endpoint
router.get('/files', (req, res) => {
    const requestId = req.requestId;
    const filesPerf = performanceLogger('getFilesList');
    
    logActivity('DEBUG', 'Files list requested', '', requestId);
    
    try {
        const files = getUploadedFiles();
        
        filesPerf.end(`loaded ${files.length} files`);
        
        logActivity('SUCCESS', 'Files list generated', '', requestId, {
            fileCount: files.length,
            totalSize: `${Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024)}MB`,
            oldestFile: files.length > 0 ? files[files.length - 1].created : null,
            newestFile: files.length > 0 ? files[0].created : null
        });
        
        res.json(files);
        
    } catch (error) {
        logError(error, 'Failed to load files list', requestId);
        res.status(500).json({ 
            error: 'Błąd odczytu plików',
            code: 'FILES_READ_ERROR',
            requestId: requestId
        });
    }
});

// 🎯 Enhanced QR code generation endpoint with dynamic URL detection
router.get('/qr', async (req, res) => {
    const requestId = req.requestId;
    const qrPerf = performanceLogger('generateQR');
    
    console.log('🔍 QR Request received');
    console.log('   Headers:', {
        host: req.get('Host'),
        cfVisitor: req.get('CF-Visitor'),
        xForwardedHost: req.get('X-Forwarded-Host')
    });
    
    // Smart URL detection - ALWAYS point to /upload
    let baseURL;
    
    if (req.query.url) {
        // Use provided URL but ensure it ends with /upload
        baseURL = req.query.url.replace('/upload', ''); // Remove if exists
        console.log('📝 Using provided base URL:', baseURL);
    } else {
        // Auto-detect best URL
        const host = req.get('Host');
        
        if (host && host.includes('trycloudflare.com')) {
            baseURL = `https://${host}`;
            console.log('🌐 Detected tunnel URL:', baseURL);
        } else {
            baseURL = `http://localhost:${config.PORT}`;
            console.log('🏠 Using localhost URL:', baseURL);
        }
    }
    
    // ALWAYS point to the upload page for guests
    const uploadURL = `${baseURL}/upload`;
    console.log('✅ Final QR URL (UPLOAD PAGE):', uploadURL);
    
    logActivity('DEBUG', 'QR code generation requested', '', requestId, {
        detectedBaseURL: baseURL,
        finalUploadURL: uploadURL,
        providedURL: req.query.url
    });
    
    try {
        const qrDataUrl = await QRCode.toDataURL(uploadURL, config.QR_OPTIONS);
        
        qrPerf.end(`for URL: ${uploadURL}`);
        
        logActivity('SUCCESS', 'QR code generated', '', requestId, {
            url: uploadURL,
            dataUrlLength: qrDataUrl.length,
            format: 'PNG data URL'
        });
        
        console.log('✅ QR code generated successfully for UPLOAD page');
        res.send(qrDataUrl);
        
    } catch (error) {
        console.error('❌ QR generation error:', error);
        logError(error, 'QR code generation failed', requestId);
        res.status(500).json({ 
            error: 'Błąd generowania QR kodu',
            code: 'QR_GENERATION_ERROR',
            requestId: requestId
        });
    }
});

// 📱 QR code download endpoint for printing
router.get('/qr-download', async (req, res) => {
    const requestId = req.requestId;
    
    console.log('📥 QR Download requested');
    
    try {
        // Get the URL
        let baseURL;
        const host = req.get('Host');
        
        if (req.query.url) {
            baseURL = req.query.url;
        } else if (host && host.includes('trycloudflare.com')) {
            baseURL = `https://${host}`;
        } else {
            baseURL = `http://localhost:${config.PORT}`;
        }
        
        const uploadURL = `${baseURL}/upload`;
        
        // Generate QR code as PNG buffer
        const qrPngBuffer = await QRCode.toBuffer(uploadURL, {
            ...config.QR_OPTIONS,
            type: 'png',
            width: 800, // Higher resolution for printing
            margin: 4
        });
        
        // Set headers for file download
        const filename = `qr-code-${config.EVENT_NAME.replace(/\s+/g, '-')}.png`;
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', qrPngBuffer.length);
        
        logActivity('SUCCESS', 'QR code downloaded', '', requestId, {
            url: uploadURL,
            filename: filename,
            size: `${Math.round(qrPngBuffer.length / 1024)}KB`
        });
        
        console.log('✅ QR PNG generated for download');
        res.send(qrPngBuffer);
        
    } catch (error) {
        console.error('❌ QR download error:', error);
        logError(error, 'QR code download failed', requestId);
        res.status(500).json({ 
            error: 'Błąd pobierania QR kodu',
            code: 'QR_DOWNLOAD_ERROR',
            requestId: requestId
        });
    }
});

// 📱 Enhanced QR code generation for admin panel
router.get('/qr-upload', async (req, res) => {
    const requestId = req.requestId;
    const qrPerf = performanceLogger('generateQRUpload');
    
    console.log('📱 QR Upload generation requested');
    
    try {
        // Use the same tunnel detection logic as public-url endpoint
        const tunnelInfo = detectTunnel(req);
        
        // 🔧 FORCE tunnel detection for permanent URL
        const forceTunnel = req.query.force === 'tunnel' || 
                           req.headers.host?.includes('gosiaitomek.redirectme.net') ||
                           process.env.FORCE_TUNNEL === 'true';
        
        if (forceTunnel) {
            console.log('🔧 FORCING tunnel detection for QR generation');
            tunnelInfo.tunnelActive = true;
        }
        
        // ALWAYS use your permanent domain when tunnel is active (forced or real)
        let uploadURL;
        
        if (tunnelInfo.tunnelActive) {
            uploadURL = 'https://gosiaitomek.redirectme.net/upload';
            console.log('🌐 Using PERMANENT tunnel URL for QR:', uploadURL);
        } else {
            uploadURL = `http://localhost:${config.PORT}/upload`;
            console.log('🏠 Using localhost URL for QR:', uploadURL);
        }
        
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(uploadURL, {
            ...config.QR_OPTIONS,
            width: 256,
            margin: 2,
            errorCorrectionLevel: 'M' // Medium error correction for printing
        });
        
        qrPerf.end(`for URL: ${uploadURL}`);
        
        logActivity('SUCCESS', 'QR code generated for admin', '', requestId, {
            url: uploadURL,
            isTunnel: tunnelInfo.tunnelActive,
            forceTunnel: forceTunnel,
            isPermanentDomain: uploadURL.includes('gosiaitomek.redirectme.net'),
            qrSize: qrDataUrl.length
        });
        
        res.json({
            success: true,
            qrCode: qrDataUrl,
            uploadUrl: uploadURL,
            message: tunnelInfo.tunnelActive ? 
                'QR code generated with PERMANENT tunnel URL - Ready for printing!' : 
                'QR code generated with localhost URL',
            isTunnel: tunnelInfo.tunnelActive,
            isPermanentUrl: uploadURL.includes('gosiaitomek.redirectme.net'),
            requestId: requestId
        });
        
    } catch (error) {
        console.error('❌ QR generation error:', error);
        logError(error, 'QR upload generation failed', requestId);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate QR code',
            code: 'QR_GENERATION_ERROR',
            requestId: requestId
        });
    }
});


// Helper function to detect tunnel status (add this near the top of your file)
function detectTunnelStatus(req) {
    const host = req.get('host') || '';
    const weddingDomain = req.weddingDomain || '';
    const forceTunnel = req.forceTunnel || false;
    
    // Force tunnel mode via environment variable
    if (forceTunnel) {
        return {
            tunnelActive: true,
            detectionMethod: 'environment_variable'
        };
    }
    
    // Force tunnel mode via query parameter
    if (req.query.force === 'tunnel') {
        return {
            tunnelActive: true,
            detectionMethod: 'query_parameter'
        };
    }
    
    // Check if host matches DuckDNS domain
    if (host.includes('.duckdns.org')) {
        return {
            tunnelActive: true,
            detectionMethod: 'duckdns_domain'
        };
    }
    
    // Check if using custom wedding domain
    if (weddingDomain && weddingDomain !== 'localhost:3000' && host.includes(weddingDomain.split(':')[0])) {
        return {
            tunnelActive: true,
            detectionMethod: 'custom_domain'
        };
    }
    
    // Default to local
    return {
        tunnelActive: false,
        detectionMethod: 'localhost_detected'
    };
}

// Update your /public-url endpoint (replace existing one):
router.get('/public-url', (req, res) => {
    const requestId = req.requestId || 'no-id';
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    
    const tunnelStatus = detectTunnelStatus(req);
    
    let uploadURL;
    if (tunnelStatus.tunnelActive) {
        // Use the wedding domain (DuckDNS or custom)
        const domain = req.weddingDomain || host;
        uploadURL = `https://${domain}/upload`;
    } else {
        // Local development
        uploadURL = `${protocol}://${host}/upload`;
    }
    
    logActivity('INFO', 'Public URL requested', '', requestId, {
        host: host,
        uploadURL: uploadURL,
        tunnelActive: tunnelStatus.tunnelActive,
        detectionMethod: tunnelStatus.detectionMethod,
        weddingDomain: req.weddingDomain
    });
    
    res.json({
        uploadURL: uploadURL,
        tunnelActive: tunnelStatus.tunnelActive,
        detectionMethod: tunnelStatus.detectionMethod,
        host: host,
        weddingDomain: req.weddingDomain,
        forceTunnel: req.forceTunnel,
        timestamp: new Date().toISOString()
    });
});

// Update your /qr-upload endpoint (replace existing one):
router.get('/qr-upload', async (req, res) => {
    const requestId = req.requestId || 'no-id';
    
    try {
        logActivity('INFO', 'QR code generation started', '', requestId);
        
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        
        const tunnelStatus = detectTunnelStatus(req);
        
        let uploadURL;
        if (tunnelStatus.tunnelActive) {
            // Use the wedding domain (DuckDNS or custom)
            const domain = req.weddingDomain || host;
            uploadURL = `https://${domain}/upload`;
        } else {
            // Local development
            uploadURL = `${protocol}://${host}/upload`;
        }
        
        // Generate QR code
        const QRCode = require('qrcode');
        const qrCodeDataURL = await QRCode.toDataURL(uploadURL, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 512
        });
        
        logActivity('SUCCESS', 'QR code generated', uploadURL, requestId, {
            tunnelActive: tunnelStatus.tunnelActive,
            detectionMethod: tunnelStatus.detectionMethod,
            weddingDomain: req.weddingDomain,
            qrDataLength: qrCodeDataURL.length
        });
        
        res.json({
            success: true,
            qrCode: qrCodeDataURL,
            uploadUrl: uploadURL,
            tunnelActive: tunnelStatus.tunnelActive,
            detectionMethod: tunnelStatus.detectionMethod,
            weddingDomain: req.weddingDomain,
            message: tunnelStatus.tunnelActive ? 
                `QR code generated with DuckDNS URL: ${uploadURL}` : 
                `QR code generated with local URL: ${uploadURL}`
        });
        
    } catch (error) {
        logError(error, 'QR code generation failed', requestId);
        res.status(500).json({
            success: false,
            error: 'Failed to generate QR code',
            details: error.message
        });
    }
});

// 🌐 Endpoint to get current public URL info
router.get('/public-url', (req, res) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('DEBUG', 'API route accessed', 'GET /public-url', requestId);
    console.log('🌐 Public URL info requested');
    
    // Use improved tunnel detection
    const tunnelInfo = detectTunnel(req);
    
    // 🔧 TEMPORARY FIX: Force tunnel detection
    // Remove this once DNS is working
    const forceTunnel = req.query.force === 'tunnel' || 
                       req.headers.host?.includes('gosiaitomek.redirectme.net') ||
                       process.env.FORCE_TUNNEL === 'true';
    
    if (forceTunnel) {
        console.log('🔧 FORCING tunnel detection');
        tunnelInfo.tunnelActive = true;
        tunnelInfo.isLocal = false;
        tunnelInfo.isTunnel = true;
    }
    
    // Determine the base URL
    let baseURL, uploadURL;
    
    if (tunnelInfo.tunnelActive) {
        // Tunnel is active - use the public domain
        baseURL = 'https://gosiaitomek.redirectme.net';
        uploadURL = 'https://gosiaitomek.redirectme.net/upload';
    } else {
        // No tunnel - use localhost
        baseURL = 'http://localhost:3000';
        uploadURL = 'http://localhost:3000/upload';
    }
    
    const urlInfo = {
        baseURL,
        uploadURL,
        isLocal: !tunnelInfo.tunnelActive,
        isTunnel: tunnelInfo.tunnelActive,
        tunnelActive: tunnelInfo.tunnelActive,
        requestId
    };
    
    console.log('📋 URL info:', urlInfo);
    
    logActivity('DEBUG', 'Public URL requested', '', requestId, urlInfo);
    
    res.json(urlInfo);
});
// 📥 Enhanced ZIP download endpoint
router.get('/download-all', (req, res) => {
    const requestId = req.requestId;
    const archivePerf = performanceLogger('createArchive');
    
    logActivity('INFO', 'ZIP download requested', '', requestId);
    
    try {
        const archive = archiver('zip', { 
            zlib: { level: 9 } // Maximum compression
        });
        
        const date = new Date().toISOString().split('T')[0];
        const zipName = `${config.EVENT_NAME.replace(/\s+/g, '-')}-${date}.zip`;
        
        logActivity('DEBUG', 'Creating ZIP archive', '', requestId, {
            zipName: zipName,
            sourceDirectory: config.UPLOADS_DIR,
            compressionLevel: 9
        });
        
        // Set response headers for download
        res.attachment(zipName);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Cache-Control', 'no-cache');
        
        // Pipe archive to response
        archive.pipe(res);
        
        // Track archive progress
        let filesAdded = 0;
        archive.on('entry', (entry) => {
            filesAdded++;
            logActivity('DEBUG', 'File added to archive', entry.name, requestId, {
                fileNumber: filesAdded,
                size: entry.stats.size
            });
        });
        
        // Handle archive errors
        archive.on('error', (err) => {
            logError(err, 'Archive creation error', requestId);
            if (!res.headersSent) {
                res.status(500).json({ 
                    error: 'Błąd tworzenia archiwum',
                    code: 'ARCHIVE_ERROR',
                    requestId: requestId
                });
            }
        });
        
        // Handle archive completion
        archive.on('end', () => {
            const archiveSize = Math.round(archive.pointer() / 1024 / 1024 * 100) / 100;
            
            archivePerf.end(`${filesAdded} files, ${archiveSize}MB`);
            
            logActivity('SUCCESS', 'ZIP archive completed', '', requestId, {
                finalSize: `${archiveSize}MB`,
                filesIncluded: filesAdded,
                compressionRatio: filesAdded > 0 ? `${Math.round((1 - archive.pointer() / (filesAdded * 1024 * 1024)) * 100)}%` : 'N/A'
            });
        });
        
        // Add all files from uploads directory
        logActivity('DEBUG', 'Adding files to archive', config.UPLOADS_DIR, requestId);
        archive.directory(config.UPLOADS_DIR, false);
        
        // Finalize archive
        archive.finalize();
        
    } catch (error) {
        logError(error, 'ZIP download setup failed', requestId);
        res.status(500).json({ 
            error: 'Błąd podczas tworzenia archiwum',
            code: 'ARCHIVE_SETUP_ERROR',
            requestId: requestId
        });
    }
});

// 📊 Enhanced system statistics endpoint
router.get('/stats', (req, res) => {
    const requestId = req.requestId;
    const statsPerf = performanceLogger('generateStats');
    
    logActivity('DEBUG', 'Statistics requested', '', requestId);
    
    try {
        const files = getUploadedFiles();
        const logStats = analyzeActivityLogs();
        
        // File statistics
        const photos = files.filter(f => f.type.startsWith('image')).length;
        const videos = files.filter(f => f.type.startsWith('video')).length;
        const totalSize = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024);
        
        // Time-based statistics
        const now = new Date();
        const today = files.filter(f => {
            const fileDate = new Date(f.created);
            return fileDate.toDateString() === now.toDateString();
        }).length;
        
        const thisHour = files.filter(f => {
            const fileDate = new Date(f.created);
            return fileDate.getHours() === now.getHours() && 
                   fileDate.toDateString() === now.toDateString();
        }).length;
        
        // File type breakdown
        const fileTypes = {};
        files.forEach(f => {
            const ext = f.name.split('.').pop().toLowerCase();
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        });
        
        // Average file size
        const avgFileSize = files.length > 0 ? 
            Math.round(files.reduce((sum, f) => sum + f.size, 0) / files.length / 1024) : 0;
        
        const stats = {
            files: {
                total: files.length,
                photos: photos,
                videos: videos,
                totalSizeMB: totalSize,
                averageSizeKB: avgFileSize,
                fileTypes: fileTypes
            },
            activity: {
                uploadsToday: today,
                uploadsThisHour: thisHour,
                totalUploads: logStats.uploads,
                totalActivities: logStats.totalActivities,
                errors: logStats.errors || 0,
                warnings: logStats.warnings || 0
            },
            system: {
                uptime: Math.floor(process.uptime()),
                uptimeFormatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
                memoryUsage: {
                    used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
                },
                nodeVersion: process.version,
                platform: process.platform
            },
            config: {
                eventName: config.EVENT_NAME,
                maxFileSize: `${config.MAX_FILE_SIZE / 1024 / 1024}MB`,
                maxFiles: config.MAX_FILES_PER_UPLOAD,
                rateLimit: `${config.RATE_LIMIT.MAX_UPLOADS}/${config.RATE_LIMIT.WINDOW_MS / 1000 / 60}min`
            }
        };
        
        statsPerf.end('comprehensive stats generated');
        
        logActivity('SUCCESS', 'Statistics generated', '', requestId, {
            totalFiles: files.length,
            calculationTime: 'see performance log'
        });
        
        res.json(stats);
        
    } catch (error) {
        logError(error, 'Statistics generation failed', requestId);
        res.status(500).json({ 
            error: 'Błąd generowania statystyk',
            code: 'STATS_ERROR',
            requestId: requestId
        });
    }
});

// 🔄 Enhanced health check endpoint
router.get('/health', (req, res) => {
    const requestId = req.requestId;
    
    logActivity('DEBUG', 'Health check requested', '', requestId);
    
    try {
        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            event: config.EVENT_NAME,
            uptime: Math.round(process.uptime()),
            version: require('../package.json').version || '1.0.0',
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
            },
            requestId: requestId
        };
        
        logActivity('SUCCESS', 'Health check completed', '', requestId, health);
        res.json(health);
        
    } catch (error) {
        logError(error, 'Health check failed', requestId);
        res.status(500).json({ 
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            requestId: requestId
        });
    }
});

// 📋 Enhanced logs endpoint (admin only)
router.get('/logs', (req, res) => {
    const requestId = req.requestId;
    
    logActivity('INFO', 'Log access requested', '', requestId, {
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    
    try {
        const logStats = analyzeActivityLogs();
        const limit = parseInt(req.query.limit) || 50;
        const level = req.query.level || 'all';
        
        let filteredLogs = logStats.recentLogs;
        
        // Filter by log level if specified
        if (level !== 'all') {
            filteredLogs = logStats.recentLogs.filter(log => 
                log.toLowerCase().includes(`[${level.toLowerCase()}]`)
            );
        }
        
        // Limit results
        filteredLogs = filteredLogs.slice(0, limit);
        
        logActivity('SUCCESS', 'Logs retrieved', '', requestId, {
            totalLogs: logStats.totalActivities,
            filteredCount: filteredLogs.length,
            level: level,
            limit: limit
        });
        
        res.json({
            logs: filteredLogs,
            statistics: {
                total: logStats.totalActivities,
                uploads: logStats.uploads,
                errors: logStats.errors || 0,
                warnings: logStats.warnings || 0,
                filtered: filteredLogs.length
            },
            filters: {
                level: level,
                limit: limit
            },
            requestId: requestId
        });
        
    } catch (error) {
        logError(error, 'Failed to retrieve logs', requestId);
        res.status(500).json({ 
            error: 'Błąd odczytu logów',
            code: 'LOGS_READ_ERROR',
            requestId: requestId
        });
    }
});

// 🧹 File cleanup endpoint (admin only, manual trigger)
router.post('/cleanup', (req, res) => {
    const requestId = req.requestId;
    const daysOld = parseInt(req.body.daysOld) || 30;
    
    logActivity('WARN', 'Manual cleanup requested', '', requestId, {
        daysOld: daysOld,
        userAgent: req.get('User-Agent'),
        ip: req.ip
    });
    
    try {
        const { cleanupOldFiles } = require('./utils');
        const deletedCount = cleanupOldFiles(daysOld);
        
        logActivity('SUCCESS', 'Manual cleanup completed', '', requestId, {
            deletedFiles: deletedCount,
            daysOld: daysOld
        });
        
        res.json({
            message: 'Cleanup completed',
            deletedFiles: deletedCount,
            daysOld: daysOld,
            requestId: requestId
        });
        
    } catch (error) {
        logError(error, 'Manual cleanup failed', requestId);
        res.status(500).json({ 
            error: 'Błąd podczas czyszczenia plików',
            code: 'CLEANUP_ERROR',
            requestId: requestId
        });
    }
});

// 📊 Real-time status endpoint for monitoring
router.get('/status', (req, res) => {
    const requestId = req.requestId;
    
    try {
        const files = getUploadedFiles();
        const recentFiles = files.filter(f => {
            const fileDate = new Date(f.created);
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            return fileDate > tenMinutesAgo;
        });
        
        const status = {
            online: true,
            timestamp: new Date().toISOString(),
            recentActivity: {
                filesLast10Min: recentFiles.length,
                lastUpload: files.length > 0 ? files[0].created : null
            },
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage().heapUsed,
                connections: req.connection?.server?._connections || 'unknown'
            },
            requestId: requestId
        };
        
        logActivity('DEBUG', 'Status check', '', requestId, {
            recentFiles: recentFiles.length,
            systemOk: true
        });
        
        res.json(status);
        
    } catch (error) {
        logError(error, 'Status check failed', requestId);
        res.status(500).json({ 
            online: false,
            error: 'Status check failed',
            timestamp: new Date().toISOString(),
            requestId: requestId
        });
    }
});

// 🖼️ Image preview endpoint with HEIC support
router.get('/preview/:filename', async (req, res) => {
    const requestId = req.requestId;
    const filename = req.params.filename;
    const size = parseInt(req.query.size) || 300; // Default thumbnail size
    
    logActivity('DEBUG', 'Image preview requested', filename, requestId, {
        requestedSize: size
    });
    
    try {
        const path = require('path');
        const fs = require('fs');
        const filePath = path.join(config.UPLOADS_DIR, filename);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            logActivity('WARN', 'Preview file not found', filename, requestId);
            return res.status(404).json({ 
                error: 'File not found',
                code: 'FILE_NOT_FOUND',
                requestId: requestId
            });
        }
        
        const fileExt = path.extname(filename).toLowerCase();
        const isHEIC = ['.heic', '.heif'].includes(fileExt);
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'].includes(fileExt);
        const isVideo = ['.mp4', '.mov', '.avi'].includes(fileExt);
        
        // For HEIC files, convert to JPEG for browser display
        if (isHEIC) {
            logActivity('DEBUG', 'HEIC file conversion requested', filename, requestId);
            
            try {
                const heicConvert = require('heic-convert');
                const sharp = require('sharp');
                
                // Read HEIC file
                const heicBuffer = fs.readFileSync(filePath);
                
                // Convert HEIC to JPEG
                const jpegBuffer = await heicConvert({
                    buffer: heicBuffer,
                    format: 'JPEG',
                    quality: 0.8
                });
                
                // Resize if needed for thumbnails
                const resizedBuffer = await sharp(jpegBuffer)
                    .resize(size, size, { 
                        fit: 'inside', 
                        withoutEnlargement: true 
                    })
                    .jpeg({ quality: 85 })
                    .toBuffer();
                
                logActivity('SUCCESS', 'HEIC converted to JPEG', filename, requestId, {
                    originalSize: `${Math.round(heicBuffer.length / 1024)}KB`,
                    convertedSize: `${Math.round(resizedBuffer.length / 1024)}KB`,
                    targetSize: `${size}x${size}`
                });
                
                res.setHeader('Content-Type', 'image/jpeg');
                res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
                return res.send(resizedBuffer);
                
            } catch (conversionError) {
                logError(conversionError, 'HEIC conversion failed', requestId);
                
                // Fallback: try to serve original HEIC file
                logActivity('WARN', 'HEIC conversion failed, serving original', filename, requestId);
                res.setHeader('Content-Type', 'image/heic');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                return res.sendFile(filePath);
            }
        }
        
        // For standard images, resize for thumbnails if requested
        if (isImage) {
            logActivity('DEBUG', 'Standard image preview', filename, requestId);
            
            try {
                // If size is specified and it's a thumbnail request, resize the image
                if (size < 800) {
                    const sharp = require('sharp');
                    const imageBuffer = fs.readFileSync(filePath);
                    
                    const resizedBuffer = await sharp(imageBuffer)
                        .resize(size, size, { 
                            fit: 'inside', 
                            withoutEnlargement: true 
                        })
                        .jpeg({ quality: 85 })
                        .toBuffer();
                    
                    logActivity('DEBUG', 'Image resized for thumbnail', filename, requestId, {
                        originalSize: `${Math.round(imageBuffer.length / 1024)}KB`,
                        thumbnailSize: `${Math.round(resizedBuffer.length / 1024)}KB`,
                        targetSize: `${size}x${size}`
                    });
                    
                    res.setHeader('Content-Type', 'image/jpeg');
                    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
                    return res.send(resizedBuffer);
                } else {
                    // Serve original image for full-size requests
                    const mimeTypes = {
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.png': 'image/png',
                        '.gif': 'image/gif',
                        '.webp': 'image/webp',
                        '.bmp': 'image/bmp',
                        '.tiff': 'image/tiff',
                        '.tif': 'image/tiff'
                    };
                    
                    res.setHeader('Content-Type', mimeTypes[fileExt] || 'image/jpeg');
                    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
                    return res.sendFile(filePath);
                }
            } catch (resizeError) {
                logError(resizeError, 'Image resize failed, serving original', requestId);
                
                // Fallback to original file
                const mimeTypes = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.webp': 'image/webp',
                    '.bmp': 'image/bmp',
                    '.tiff': 'image/tiff',
                    '.tif': 'image/tiff'
                };
                
                res.setHeader('Content-Type', mimeTypes[fileExt] || 'image/jpeg');
                res.setHeader('Cache-Control', 'public, max-age=86400');
                return res.sendFile(filePath);
            }
        }
        
        // For videos, serve a video thumbnail placeholder
        if (isVideo) {
            logActivity('DEBUG', 'Video file preview requested', filename, requestId);
            // Return a video icon response
            res.setHeader('Content-Type', 'application/json');
            return res.json({
                type: 'video',
                message: 'Video preview not supported, use video player',
                filename: filename,
                requestId: requestId
            });
        }
        
        // For unsupported files
        logActivity('WARN', 'Unsupported file type for preview', filename, requestId);
        res.status(415).json({ 
            error: 'File type not supported for preview',
            code: 'UNSUPPORTED_TYPE',
            requestId: requestId
        });
        
    } catch (error) {
        logError(error, 'Preview generation failed', requestId);
        res.status(500).json({ 
            error: 'Preview generation failed',
            code: 'PREVIEW_ERROR',
            requestId: requestId
        });
    }
});

// 🔍 File search endpoint
router.get('/search', (req, res) => {
    const requestId = req.requestId;
    const query = req.query.q || '';
    const type = req.query.type || 'all'; // 'image', 'video', 'all'
    const sortBy = req.query.sort || 'date'; // 'date', 'size', 'name'
    
    logActivity('DEBUG', 'File search requested', '', requestId, {
        query: query,
        type: type,
        sortBy: sortBy
    });
    
    try {
        let files = getUploadedFiles();
        
        // Filter by search query
        if (query) {
            files = files.filter(f => 
                f.name.toLowerCase().includes(query.toLowerCase())
            );
        }
        
        // Filter by type
        if (type !== 'all') {
            files = files.filter(f => f.type.startsWith(type));
        }
        
        // Sort results
        switch (sortBy) {
            case 'size':
                files.sort((a, b) => b.size - a.size);
                break;
            case 'name':
                files.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'date':
            default:
                files.sort((a, b) => new Date(b.created) - new Date(a.created));
                break;
        }
        
        logActivity('SUCCESS', 'File search completed', '', requestId, {
            resultsFound: files.length,
            query: query,
            type: type,
            sortBy: sortBy
        });
        
        res.json({
            results: files,
            count: files.length,
            query: {
                search: query,
                type: type,
                sortBy: sortBy
            },
            requestId: requestId
        });
        
    } catch (error) {
        logError(error, 'File search failed', requestId);
        res.status(500).json({ 
            error: 'Błąd wyszukiwania plików',
            code: 'SEARCH_ERROR',
            requestId: requestId
        });
    }
});

module.exports = router;


