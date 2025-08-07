// middleware.js - Middleware i konfiguracja upload
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { generateSafeFilename, logActivity } = require('./utils');

// 🚫 Rate limiting dla upload
const uploadLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_UPLOADS,
    message: {
        error: 'Chwilę pauzy - za dużo przesłań naraz. Spróbuj za chwilę 😊'
    },
    standardHeaders: false,
    legacyHeaders: false,
    skip: (req) => {
        // Loguj próby przekroczenia limitu
        if (req.rateLimit && req.rateLimit.remaining === 0) {
            logActivity('RATE_LIMIT_HIT', 'Upload rate limit exceeded');
        }
        return false;
    }
});
const debugUpload = (req, res, next) => {
    console.log(`\n🔍 DEBUG UPLOAD REQUEST:`);
    console.log(`   📝 Content-Type: ${req.get('Content-Type')}`);
    console.log(`   📊 Content-Length: ${req.get('Content-Length')}`);
    console.log(`   📁 Body keys: ${Object.keys(req.body || {})}`);
    
    // Sprawdź czy to multipart/form-data
    if (!req.get('Content-Type') || !req.get('Content-Type').includes('multipart/form-data')) {
        console.log(`❌ BŁĄD: Brak multipart/form-data header!`);
    }
    
    next();
};
// 📦 Konfiguracja multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const safeFilename = generateSafeFilename(file.originalname);
        cb(null, safeFilename);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: config.MAX_FILE_SIZE,
        files: config.MAX_FILES_PER_UPLOAD
    },
fileFilter: (req, file, cb) => {
    console.log(`\n🔍 MULTER SPRAWDZA PLIK:`);
    console.log(`   📄 Nazwa: "${file.originalname}"`);
    console.log(`   📋 MIME: "${file.mimetype}"`);
    console.log(`   📏 Rozmiar: ${Math.round(file.size/1024/1024*100)/100}MB`);
    
    const fileName = file.originalname.toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    
    // HEIC/HEIF z iPhone często ma pusty lub błędny MIME type
    const isHeicFile = fileName.endsWith('.heic') || fileName.endsWith('.heif') || 
                       fileName.endsWith('.heics') || fileName.endsWith('.heifs') ||
                       mimeType.includes('heic') || mimeType.includes('heif');
    
    if (isHeicFile) {
        console.log(`✅ AKCEPTUJĘ HEIC/HEIF: "${file.originalname}"`);
        logActivity('FILE_ACCEPTED_HEIC', `${file.originalname} (${file.mimetype || 'empty MIME'})`);
        return cb(null, true);
    }
    
    // Sprawdź standardowe typy MIME
    const isImage = mimeType.startsWith('image/');
    const isVideo = mimeType.startsWith('video/');
    
    if (!isImage && !isVideo) {
        // Sprawdź po rozszerzeniu jako fallback
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp', '.avif'];
        const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.m4v', '.wmv'];
        
        const hasImageExt = imageExts.some(ext => fileName.endsWith(ext));
        const hasVideoExt = videoExts.some(ext => fileName.endsWith(ext));
        
        if (hasImageExt || hasVideoExt) {
            console.log(`✅ AKCEPTUJĘ PO ROZSZERZENIU: "${file.originalname}" (${hasImageExt ? 'obraz' : 'film'})`);
            logActivity('FILE_ACCEPTED_EXTENSION', `${file.originalname} (fallback by extension)`);
            return cb(null, true);
        }
        
        const errorMsg = `ODRZUCONO: "${file.originalname}" - MIME: "${file.mimetype}" - rozszerzenie: "${require('path').extname(file.originalname)}"`;
        console.log(`❌ ${errorMsg}`);
        logActivity('FILE_REJECTED', errorMsg);
        return cb(new Error(`Nieobsługiwany format: ${file.originalname}`));
    }
    
    // Sprawdź niebezpieczne rozszerzenia
    const ext = require('path').extname(file.originalname).toLowerCase();
    const suspiciousExts = ['.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.js', '.jar'];
    if (suspiciousExts.includes(ext)) {
        const errorMsg = `ODRZUCONO: "${file.originalname}" - niebezpieczne rozszerzenie: "${ext}"`;
        console.log(`❌ ${errorMsg}`);
        logActivity('FILE_REJECTED_SUSPICIOUS', errorMsg);
        return cb(new Error('Zabronione rozszerzenie pliku'));
    }
    
    console.log(`✅ AKCEPTUJĘ: "${file.originalname}" (${isImage ? 'obraz' : 'film'})`);
    logActivity('FILE_ACCEPTED', `${file.originalname} (${file.mimetype})`);
    cb(null, true);
}
});

// 🛡️ Middleware bezpieczeństwa
const securityMiddleware = (req, res, next) => {
    // Blokuj niebezpieczne metody HTTP
    if (!['GET', 'POST'].includes(req.method)) {
        logActivity('BLOCKED_METHOD', `Blocked ${req.method} request to ${req.path}`);
        return res.status(405).json({ error: 'Metoda nie dozwolona' });
    }
    
    // Dodaj nagłówki bezpieczeństwa
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
};

// 📷 Middleware ochrony plików - tylko odczyt
const protectFilesMiddleware = (req, res, next) => {
    if (req.method !== 'GET') {
        logActivity('BLOCKED_FILE_ACCESS', `Blocked ${req.method} access to files`);
        return res.status(403).json({ error: 'Tylko odczyt dozwolony' });
    }
    
    // Dodaj cache headers dla plików
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // cache na rok
    next();
};

// ❌ 404 Handler
const notFoundHandler = (req, res) => {
    logActivity('404_ERROR', `Page not found: ${req.path}`);
    
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
        </style>
    </head>
    <body>
        <div class="error-box">
            <h1>🤔</h1>
            <p>Hmm, ta strona nie istnieje...</p>
            <a href="/">🏠 Powrót do strony głównej</a>
        </div>
    </body>
    </html>
    `);
};

// 🚨 Error handler
const errorHandler = (error, req, res, next) => {
    logActivity('ERROR', error.message);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'Plik jest za duży. Maksymalny rozmiar to 200MB.' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                error: 'Za dużo plików naraz. Maksymalnie 10 plików.' 
            });
        }
    }
    
    res.status(500).json({ 
        error: 'Wystąpił błąd serwera. Spróbuj ponownie.' 
    });
};

module.exports = {
    uploadLimiter,
    upload,
    debugUpload,  
    securityMiddleware,
    protectFilesMiddleware,
    notFoundHandler,
    errorHandler
};