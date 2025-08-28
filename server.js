// server.js - Enhanced wedding website server with optimized photo/video uploads
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const session = require('express-session');
require('dotenv').config();
// Import configuration and utilities
const config = require('./config');

// Initialize Express app
const app = express();

// Initialize Sharp with error handling
let sharp;
try {
    sharp = require('sharp');
    console.log('Sharp loaded successfully for image processing');
} catch (error) {
    console.warn('Sharp not available - image processing will be limited');
}

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static('public'));

// Session configuration
app.use(session({
    secret: config.SESSION_SECRET || 'wedding-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Request ID middleware for logging
app.use((req, res, next) => {
    req.requestId = uuidv4().substring(0, 8);
    next();
});

// Enhanced logging utilities
const logActivity = (level, message, details = '', requestId = '', extra = {}) => {
    const timestamp = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
    const logEntry = {
        timestamp,
        level,
        message,
        details,
        requestId,
        ...extra
    };
    
    const logSymbol = {
        'INFO': '📋',
        'WARN': '⚠️',
        'ERROR': '❌',
        'SUCCESS': '✅',
        'DEBUG': '🔍'
    }[level] || '📝';
    
    console.log(`${logSymbol} ${level} [${timestamp}] [${requestId}] ${message}`);
    if (details) console.log(`    Extra data: ${details}`);
    if (Object.keys(extra).length > 0) {
        console.log(`    Extra data: ${JSON.stringify(extra, null, 2)}`);
    }
};

const logError = (error, message, requestId = '') => {
    logActivity('ERROR', message, error.message, requestId, {
        stack: error.stack,
        name: error.name
    });
};

// Initialize directories
const initializeDirectories = () => {
    const directories = [
        config.UPLOADS_DIR || './uploads',
        './data',
        './views',
        path.join(config.UPLOADS_DIR || './uploads', 'thumbnails')
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logActivity('SUCCESS', `Directory created: ${dir}`);
        }
    });
};

initializeDirectories();

// Template rendering function
const renderTemplate = (templateName, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, 'views', `${templateName}.html`);
        
        if (!fs.existsSync(templatePath)) {
            logActivity('WARN', `Template not found: ${templateName}.html`);
            return `<html><body><h1>Template Error</h1><p>Template ${templateName}.html not found</p></body></html>`;
        }
        
        let template = fs.readFileSync(templatePath, 'utf8');
        
        // Replace template variables
        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            template = template.replace(regex, variables[key]);
        });
        
        return template;
    } catch (error) {
        logError(error, `Failed to render template: ${templateName}`);
        return `<html><body><h1>Template Error</h1><p>Failed to load ${templateName}.html</p></body></html>`;
    }
};

// Enhanced file upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = config.UPLOADS_DIR || './uploads';
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, uniqueSuffix + '_' + safeName);
    }
});

// Enhanced file filter with better validation
const fileFilter = (req, file, cb) => {
    const requestId = req.requestId || 'no-id';
    
    logActivity('DEBUG', 'File validation', `${file.originalname} (${file.mimetype})`, requestId);
    
    // Allowed file types
    const allowedMimeTypes = [
        // Images
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'image/heic', 'image/heif', 'image/bmp', 'image/tiff',
        // Videos
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
        'video/mov', 'video/avi', 'video/3gpp', 'video/x-ms-wmv'
    ];
    
    const allowedExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.tiff',
        '.mp4', '.mov', '.avi', '.wmv', '.webm', '.3gp', '.quicktime'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype || '';
    
    // Security: Block dangerous file types
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.php', '.js', '.html', '.htm'];
    if (dangerousExtensions.includes(ext)) {
        logActivity('WARN', 'Dangerous file type blocked', file.originalname, requestId);
        return cb(new Error('Nieobsługiwany typ pliku ze względów bezpieczeństwa'));
    }
    
    // Check if file type is allowed
    const isValidMime = allowedMimeTypes.includes(mimeType);
    const isValidExt = allowedExtensions.includes(ext);
    const isUnknownMime = !mimeType || mimeType === 'application/octet-stream'; // For HEIC files
    
    if (isValidMime || (isValidExt && isUnknownMime)) {
        logActivity('SUCCESS', 'File accepted', file.originalname, requestId);
        cb(null, true);
    } else {
        logActivity('WARN', 'File rejected', `${file.originalname} - ${mimeType}`, requestId);
        cb(new Error('Nieobsługiwany typ pliku - dozwolone tylko zdjęcia i filmy'));
    }
};

// Configure multer with enhanced settings
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.MAX_FILE_SIZE || 50 * 1024 * 1024, // 50MB default
        files: config.MAX_FILES_PER_UPLOAD || 10,
        fieldSize: 2 * 1024 * 1024, // 2MB field size
        fields: 20 // Max number of non-file fields
    }
});

// Gallery management functions
const saveFilesToGallery = async (files) => {
    try {
        const galleryFile = path.join(__dirname, 'data', 'gallery.json');
        let gallery = [];
        
        // Load existing gallery
        if (fs.existsSync(galleryFile)) {
            try {
                const galleryData = fs.readFileSync(galleryFile, 'utf8');
                gallery = JSON.parse(galleryData);
            } catch (parseError) {
                logActivity('WARN', 'Gallery file corrupted, starting fresh');
                gallery = [];
            }
        }
        
        // Add new files
        gallery.push(...files);
        
        // Save updated gallery
        fs.writeFileSync(galleryFile, JSON.stringify(gallery, null, 2));
        
        logActivity('SUCCESS', `Gallery updated with ${files.length} files. Total: ${gallery.length}`);
        
    } catch (error) {
        logError(error, 'Failed to save files to gallery');
        throw error;
    }
};

const processImageWithSharp = async (filePath, filename) => {
    if (!sharp) return null;
    
    try {
        const thumbnailDir = path.join(config.UPLOADS_DIR || './uploads', 'thumbnails');
        const thumbnailPath = path.join(thumbnailDir, 'thumb_' + filename);
        
        // Create thumbnail
        await sharp(filePath)
            .resize(400, 400, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 85, progressive: true })
            .toFile(thumbnailPath);
        
        // Get image metadata
        const metadata = await sharp(filePath).metadata();
        
        return {
            thumbnail: thumbnailPath,
            thumbnailFilename: 'thumb_' + filename,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format
        };
        
    } catch (error) {
        logActivity('WARN', 'Sharp processing failed', error.message);
        return null;
    }
};

const convertHeicToJpeg = async (filePath) => {
    if (!sharp) return null;
    
    try {
        const convertedPath = filePath.replace(/\.(heic|heif)$/i, '.jpg');
        const convertedFilename = path.basename(convertedPath);
        
        await sharp(filePath)
            .jpeg({ quality: 90, progressive: true })
            .toFile(convertedPath);
        
        // Remove original HEIC file
        fs.unlinkSync(filePath);
        
        return {
            convertedPath,
            convertedFilename,
            mimetype: 'image/jpeg'
        };
        
    } catch (error) {
        logActivity('WARN', 'HEIC conversion failed', error.message);
        return null;
    }
};

// MAIN ROUTES

// Home page
app.get('/', (req, res) => {
    logActivity('INFO', 'Home page accessed', '', req.requestId);
    
    const weddingDate = new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderTemplate('home', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        WEDDING_DATE: weddingDate,
        PAGE_TITLE: `${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom} - Wesele`
    }));
});

// Admin login page
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    
    res.send(renderTemplate('admin-login', {
        ERROR_MESSAGE: '',
        PAGE_TITLE: 'Panel administratora - Logowanie'
    }));
});

// Admin login handler
app.post('/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (password === config.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        logActivity('SUCCESS', 'Admin login successful', '', req.requestId, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.redirect('/admin');
    } else {
        logActivity('WARN', 'Admin login failed', '', req.requestId, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.send(renderTemplate('admin-login', {
            ERROR_MESSAGE: '<div class="error-message">Invalid password. Please try again.</div>',
            PAGE_TITLE: 'Panel administratora - Logowanie'
        }));
    }
});

// Admin logout
app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Protected admin panel
app.get('/admin', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    
    logActivity('INFO', 'Admin panel accessed', '', req.requestId);
    
    res.send(renderTemplate('admin-panel', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Panel administratora - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Photo upload page
app.get('/photos', (req, res) => {
    logActivity('INFO', 'Photo upload page accessed', '', req.requestId);
    
    res.send(renderTemplate('upload', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        MAX_FILE_SIZE: Math.round((config.MAX_FILE_SIZE || 50 * 1024 * 1024) / 1024 / 1024),
        MAX_FILES: config.MAX_FILES_PER_UPLOAD || 10,
        PAGE_TITLE: `Podziel się zdjęciami - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Gallery page
app.get('/gallery', (req, res) => {
    logActivity('INFO', 'Gallery page accessed', '', req.requestId);
    
    res.send(renderTemplate('gallery', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Galeria - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Other pages
app.get('/menu', (req, res) => {
    logActivity('INFO', 'Menu page accessed', '', req.requestId);
    res.send(renderTemplate('menu', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Menu - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

app.get('/drinks', (req, res) => {
    logActivity('INFO', 'Drinks page accessed', '', req.requestId);
    res.send(renderTemplate('drinks', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Napoje - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

app.get('/timeline', (req, res) => {
    logActivity('INFO', 'Timeline page accessed', '', req.requestId);
    res.send(renderTemplate('timeline', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Plan dnia - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

app.get('/providers', (req, res) => {
    logActivity('INFO', 'Providers page accessed', '', req.requestId);
    res.send(renderTemplate('providers', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Nasi partnerzy - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

app.get('/story', (req, res) => {
    logActivity('INFO', 'Story page accessed', '', req.requestId);
    res.send(renderTemplate('story', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Nasza historia - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

app.get('/seating', (req, res) => {
    logActivity('INFO', 'Seating page accessed', '', req.requestId);
    res.send(renderTemplate('seating', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Plan miejsc - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// API ENDPOINTS

// Enhanced file upload endpoint
app.post('/api/upload', upload.array('files'), async (req, res) => {
    const requestId = req.requestId || 'no-id';
    
    try {
        if (!req.files || req.files.length === 0) {
            logActivity('WARN', 'No files uploaded', '', requestId);
            return res.status(400).json({ success: false, error: 'Nie przesłano żadnych plików' });
        }

        const contributor = req.body.contributor || req.body.contributorName || 'Gość weselny';
        const message = req.body.message || '';
        
        logActivity('INFO', `Processing ${req.files.length} files`, `Contributor: ${contributor}`, requestId);

        const processedFiles = [];
        const errors = [];

        // Process each file
        for (const file of req.files) {
            try {
                let processedFile = {
                    id: uuidv4(),
                    originalName: file.originalname,
                    filename: file.filename,
                    mimetype: file.mimetype,
                    size: file.size,
                    uploadDate: new Date().toISOString(),
                    contributor: contributor,
                    message: message,
                    path: file.path,
                    url: `/uploads/${file.filename}`,
                    isVideo: file.mimetype.startsWith('video/'),
                    isImage: file.mimetype.startsWith('image/') || file.originalname.toLowerCase().match(/\.(heic|heif)$/)
                };

                // Process images
                if (processedFile.isImage) {
                    // Convert HEIC/HEIF to JPEG if needed
                    if (file.originalname.toLowerCase().match(/\.(heic|heif)$/)) {
                        const converted = await convertHeicToJpeg(file.path);
                        if (converted) {
                            processedFile.path = converted.convertedPath;
                            processedFile.filename = converted.convertedFilename;
                            processedFile.mimetype = converted.mimetype;
                            processedFile.url = `/uploads/${converted.convertedFilename}`;
                            logActivity('SUCCESS', 'HEIC/HEIF converted to JPEG', file.originalname, requestId);
                        }
                    }
                    
                    // Create thumbnail
                    const imageProcessing = await processImageWithSharp(processedFile.path, processedFile.filename);
                    if (imageProcessing) {
                        processedFile.thumbnail = imageProcessing.thumbnail;
                        processedFile.thumbnailFilename = imageProcessing.thumbnailFilename;
                        processedFile.thumbnailUrl = `/uploads/thumbnails/${imageProcessing.thumbnailFilename}`;
                        processedFile.width = imageProcessing.width;
                        processedFile.height = imageProcessing.height;
                        processedFile.format = imageProcessing.format;
                    }
                }

                processedFiles.push(processedFile);
                
                logActivity('SUCCESS', 'File processed', 
                    `${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, requestId);

            } catch (fileError) {
                logError(fileError, `Failed to process file: ${file.originalname}`, requestId);
                errors.push({
                    filename: file.originalname,
                    error: fileError.message
                });
                
                // Cleanup failed file
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (cleanupError) {
                        logError(cleanupError, 'Failed to cleanup file', requestId);
                    }
                }
            }
        }

        // Save processed files to gallery
        if (processedFiles.length > 0) {
            await saveFilesToGallery(processedFiles);
        }

        const response = {
            success: true,
            message: `Pomyślnie przesłano ${processedFiles.length} plików`,
            uploaded: processedFiles.length,
            errors: errors.length,
            files: processedFiles.map(f => ({
                id: f.id,
                name: f.originalName,
                type: f.isVideo ? 'video' : 'image',
                size: f.size,
                url: f.url,
                thumbnailUrl: f.thumbnailUrl || f.url
            }))
        };

        if (errors.length > 0) {
            response.errorDetails = errors;
            logActivity('WARN', `Upload completed with ${errors.length} errors`, '', requestId);
        } else {
            logActivity('SUCCESS', 'All files uploaded successfully', '', requestId);
        }

        res.json(response);

    } catch (error) {
        logError(error, 'Upload failed completely', requestId);
        
        // Cleanup all files on complete failure
        if (req.files) {
            req.files.forEach(file => {
                if (fs.existsSync(file.path)) {
                    try {
                        fs.unlinkSync(file.path);
                    } catch (cleanupError) {
                        logError(cleanupError, 'Cleanup failed', requestId);
                    }
                }
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Wystąpił błąd podczas przesyłania plików',
            details: error.message
        });
    }
});

// Gallery API endpoint
app.get('/api/gallery', (req, res) => {
    const requestId = req.requestId || 'no-id';
    
    try {
        const galleryFile = path.join(__dirname, 'data', 'gallery.json');
        
        if (!fs.existsSync(galleryFile)) {
            return res.json({ files: [], total: 0 });
        }
        
        const galleryData = fs.readFileSync(galleryFile, 'utf8');
        const gallery = JSON.parse(galleryData);
        
        // Sort by upload date (newest first)
        const sortedGallery = gallery.sort((a, b) => 
            new Date(b.uploadDate) - new Date(a.uploadDate)
        );
        
        const response = {
            files: sortedGallery.map(file => ({
                id: file.id,
                originalName: file.originalName,
                contributor: file.contributor,
                message: file.message,
                uploadDate: file.uploadDate,
                isVideo: file.isVideo,
                isImage: file.isImage,
                size: file.size,
                url: file.url,
                thumbnailUrl: file.thumbnailUrl || (file.isImage ? file.url : null),
                width: file.width,
                height: file.height
            })),
            total: gallery.length
        };
        
        logActivity('INFO', `Gallery loaded: ${gallery.length} files`, '', requestId);
        res.json(response);
        
    } catch (error) {
        logError(error, 'Failed to load gallery', requestId);
        res.status(500).json({ 
            files: [], 
            total: 0, 
            error: 'Nie udało się załadować galerii' 
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        sharp: !!sharp,
        uploadsDir: fs.existsSync(config.UPLOADS_DIR || './uploads'),
        dataDir: fs.existsSync('./data'),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
    });
});

// Serve uploaded files
app.use('/uploads', express.static(config.UPLOADS_DIR || './uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    const requestId = req.requestId || 'no-id';
    
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            logActivity('WARN', 'File too large', err.message, requestId);
            return res.status(400).json({
                success: false,
                error: 'Plik jest zbyt duży',
                maxSize: Math.round((config.MAX_FILE_SIZE || 50 * 1024 * 1024) / 1024 / 1024) + 'MB'
            });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            logActivity('WARN', 'Too many files', err.message, requestId);
            return res.status(400).json({
                success: false,
                error: 'Zbyt wiele plików',
                maxFiles: config.MAX_FILES_PER_UPLOAD || 10
            });
        }
    }
    
    logError(err, 'Unhandled error', requestId);
    res.status(500).json({
        success: false,
        error: 'Wystąpił błąd serwera'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send(`
        <html>
        <head>
            <title>Strona nie znaleziona</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }
                .container { background: rgba(255,255,255,0.9); padding: 40px; border-radius: 20px; display: inline-block; }
                h1 { color: #d63384; margin-bottom: 20px; }
                a { color: #667eea; text-decoration: none; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>404 - Strona nie znaleziona</h1>
                <p>Przepraszamy, ale ta strona nie istnieje.</p>
                <a href="/">Powrót na stronę główną</a>
            </div>
        </body>
        </html>
    `);
});

// Start server
const PORT = config.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log('\n=== WEDDING WEBSITE SERVER STARTED ===');
    console.log(`Server running on port ${PORT}`);
    console.log(`Upload directory: ${config.UPLOADS_DIR || './uploads'}`);
    console.log(`Sharp available: ${!!sharp}`);
    console.log(`Max file size: ${Math.round((config.MAX_FILE_SIZE || 50 * 1024 * 1024) / 1024 / 1024)}MB`);
    console.log(`Max files per upload: ${config.MAX_FILES_PER_UPLOAD || 10}`);
    console.log('========================================\n');
    
    logActivity('SUCCESS', 'Wedding website server started', '', null, {
        port: PORT,
        sharp: !!sharp,
        uploadsDir: config.UPLOADS_DIR || './uploads'
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

module.exports = { app, server };