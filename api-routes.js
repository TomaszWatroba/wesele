// api-routes.js - Wszystkie API endpoints
const express = require('express');
const QRCode = require('qrcode');
const archiver = require('archiver');
const config = require('./config');
const { logActivity, getUploadedFiles } = require('./utils');
const { uploadLimiter, upload, debugUpload } = require('./middleware');
 const router = express.Router();

// 📤 Upload plików
router.post('/upload', uploadLimiter, debugUpload, upload.array('files'), (req, res) => {
    console.log(`\n✅ MULTER ZAKOŃCZONY:`);
    console.log(`   📊 req.files: ${req.files ? req.files.length : 'UNDEFINED!'}`);
    
    if (req.files) {
        req.files.forEach((file, i) => {
            console.log(`   ${i+1}. ${file.originalname} (${file.mimetype}) - ${Math.round(file.size/1024)}KB`);
        });
    }
    
    if (!req.files || req.files.length === 0) {
        console.log(`❌ BRAK PLIKÓW - prawdopodobnie odrzucone przez multer`);
        logActivity('UPLOAD_FAILED', 'No files provided - rejected by multer');
        return res.status(400).json({ error: 'Nie przesłano żadnych plików lub zostały odrzucone' });
    }
    
    const totalSize = req.files.reduce((sum, f) => sum + f.size, 0);
    const fileSizeMB = Math.round(totalSize / 1024 / 1024 * 100) / 100;
    
    logActivity('UPLOAD_SUCCESS', `${req.files.length} files uploaded, ${fileSizeMB}MB total`);
    
    console.log(`✅ Nowe pliki: ${req.files.length} (${fileSizeMB}MB)`);
    req.files.forEach(file => {
        console.log(`   📁 ${file.originalname} -> ${file.filename}`);
    });
    
    res.json({ 
        message: 'Pliki przesłane pomyślnie', 
        files: req.files.map(f => ({
            original: f.originalname,
            saved: f.filename,
            size: f.size
        })),
        count: req.files.length,
        totalSize: fileSizeMB
    });
});

// 📊 Lista plików dla galerii
router.get('/files', (req, res) => {
    try {
        const files = getUploadedFiles();
        res.json(files);
    } catch (error) {
        console.error('Błąd API files:', error);
        logActivity('API_ERROR', 'Failed to load files list');
        res.status(500).json({ error: 'Błąd odczytu plików' });
    }
});

// 🎯 Generowanie QR kodu
router.get('/qr', async (req, res) => {
    try {
        const url = req.query.url || `http://localhost:${config.PORT}/upload`;
        const qrDataUrl = await QRCode.toDataURL(url, config.QR_OPTIONS);
        
        logActivity('QR_GENERATED', `QR code generated for: ${url}`);
        res.send(qrDataUrl);
    } catch (error) {
        console.error('Błąd generowania QR:', error);
        logActivity('QR_ERROR', error.message);
        res.status(500).json({ error: 'Błąd generowania QR kodu' });
    }
});

// 📥 Pobieranie wszystkich plików jako ZIP
router.get('/download-all', (req, res) => {
    try {
        const archiver = require('archiver');
        const archive = archiver('zip', { 
            zlib: { level: 9 } // Maksymalna kompresja
        });
        
        const date = new Date().toISOString().split('T')[0];
        const zipName = `${config.EVENT_NAME.replace(/\s+/g, '-')}-${date}.zip`;
        
        logActivity('DOWNLOAD_ALL_START', `Creating ZIP: ${zipName}`);
        console.log(`📦 Tworzenie archiwum: ${zipName}`);
        
        // Ustaw nagłówki dla pobierania
        res.attachment(zipName);
        res.setHeader('Content-Type', 'application/zip');
        
        // Przekieruj strumień ZIP do odpowiedzi
        archive.pipe(res);
        
        // Dodaj wszystkie pliki z katalogu uploads
        archive.directory(config.UPLOADS_DIR, false);
        
        // Obsługa błędów archiwum
        archive.on('error', (err) => {
            console.error('Błąd archiwum:', err);
            logActivity('DOWNLOAD_ERROR', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Błąd tworzenia archiwum' });
            }
        });
        
        // Zakończenie archiwum
        archive.on('end', () => {
            const archiveSize = Math.round(archive.pointer() / 1024 / 1024);
            console.log(`✅ Archiwum utworzone: ${archiveSize}MB`);
            logActivity('DOWNLOAD_ALL_COMPLETE', `ZIP created successfully, ${archiveSize}MB`);
        });
        
        // Finalizuj archiwum
        archive.finalize();
        
    } catch (error) {
        console.error('Błąd pobierania:', error);
        logActivity('DOWNLOAD_ALL_ERROR', error.message);
        res.status(500).json({ error: 'Błąd podczas tworzenia archiwum' });
    }
});

// 📊 Statystyki systemu (endpoint API)
router.get('/stats', (req, res) => {
    try {
        const files = getUploadedFiles();
        const { analyzeActivityLogs } = require('./utils');
        const logStats = analyzeActivityLogs();
        
        // Podstawowe statystyki plików
        const photos = files.filter(f => f.type.startsWith('image')).length;
        const videos = files.filter(f => f.type.startsWith('video')).length;
        const totalSize = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024);
        
        // Statystyki czasowe
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
        
        res.json({
            files: {
                total: files.length,
                photos: photos,
                videos: videos,
                totalSizeMB: totalSize
            },
            activity: {
                uploadsToday: today,
                uploadsThisHour: thisHour,
                totalUploads: logStats.uploads,
                totalActivities: logStats.totalActivities
            },
            system: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage(),
                nodeVersion: process.version
            }
        });
        
    } catch (error) {
        console.error('Błąd statystyk API:', error);
        res.status(500).json({ error: 'Błąd generowania statystyk' });
    }
});

// 🔄 Health check endpoint
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        event: config.EVENT_NAME,
        uptime: Math.round(process.uptime())
    });
});

module.exports = router;