// server.js - Clean and modular wedding website server
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const session = require('express-session');

const config = require('./config');
const { 
    initializeDirectories, 
    logActivity, 
    logError, 
    requestLogger,
    getSystemHealth
} = require('./utils');
const { 
    securityMiddleware, 
    protectFilesMiddleware, 
    notFoundHandler, 
    errorHandler,
    timeoutMiddleware,
    memoryMonitor
} = require('./middleware');


// Import routes
const apiRoutes = require('./api-routes');
const menuItems = require('./data/menuItems');
const app = express();
const drinksItems = require('./data/drinksItems');

console.log('🎉 Starting Mobile-First Wedding Website...');
console.log(`👰‍♀️ ${config.COUPLE_NAMES.bride} & 🤵‍♂️ ${config.COUPLE_NAMES.groom}`);
console.log(`🌐 Domain: ${config.DOMAIN}`);

// Initialize directories
try {
    initializeDirectories();
    // Also create views directory if it doesn't exist
    const viewsDir = path.join(__dirname, 'views');
    if (!fs.existsSync(viewsDir)) {
        fs.mkdirSync(viewsDir, { recursive: true });
        logActivity('SUCCESS', 'Views directory created');
    }

    // Create thumbnails directory for gallery
    const thumbnailsDir = path.join(config.UPLOADS_DIR, 'thumbnails');
    if (!fs.existsSync(thumbnailsDir)) {
        fs.mkdirSync(thumbnailsDir, { recursive: true });
        logActivity('SUCCESS', 'Thumbnails directory created');
    }

    // Create data directory for storing gallery metadata
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        logActivity('SUCCESS', 'Data directory created');
    }

    logActivity('SUCCESS', 'Wedding website directories initialized');
} catch (error) {
    logError(error, 'Failed to initialize directories');
    process.exit(1);
}

// Session configuration for admin authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-wedding-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Enhanced middleware stack
app.use(requestLogger);
app.use(memoryMonitor);
app.use(timeoutMiddleware(30000)); // 30 seconds
app.use(securityMiddleware);

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (CSS, JS, images)
app.use(express.static('public'));
app.use('/uploads', protectFilesMiddleware, express.static(config.UPLOADS_DIR));

// Handle favicon.ico requests to prevent errors
app.get('/favicon.ico', (req, res) => {
    res.status(204).send(); // No content
});

// ===== TEMPLATE RENDERING HELPER =====
const renderTemplate = (templateName, variables = {}) => {
    try {
        const templatePath = path.join(__dirname, 'views', `${templateName}.html`);
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

// ===== MAIN WEBSITE ROUTES =====

// 🏠 HOME PAGE - Mobile-first landing
app.get('/', (req, res) => {
    logActivity('INFO', 'Home page accessed', '', req.requestId);
    
    const weddingDate = new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    res.send(renderTemplate('home', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        WEDDING_DATE: weddingDate,
        PAGE_TITLE: `${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom} - Wesele`
    }));
});

// 📸 PHOTO UPLOAD - Mobile optimized
app.get('/photos', (req, res) => {
    logActivity('INFO', 'Photo upload page accessed', '', req.requestId);
    
    res.send(renderTemplate('upload', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        MAX_FILE_SIZE: config.MAX_FILE_SIZE / 1024 / 1024,
        MAX_FILES: config.MAX_FILES_PER_UPLOAD,
        PAGE_TITLE: `Podziel się zdjęciami i filmami - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// 🖼️ GALLERY PAGE - Browse uploaded photos and videos
app.get('/gallery', (req, res) => {
    logActivity('INFO', 'Gallery page accessed', '', req.requestId);
    
    res.send(renderTemplate('gallery', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Galeria - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// 🍽️ MENU PAGE
app.get('/menu', (req, res) => {
  try {
    const requestId = req.requestId || 'no-id';
    logActivity('INFO', 'Menu page accessed', '', requestId);
    
    // Read the menu items
    const menuItems = require('./data/menuItems');
    const coupleNames = config.COUPLE_NAMES || { bride: 'Gosia', groom: 'Tomek' };
    
    // Generate HTML from the menu items
    let html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Menu Weselne - ${coupleNames.bride} & ${coupleNames.groom}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
            }
            
            .container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px 20px;
            }
            
            .menu-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 40px;
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
            }
            
            h1 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 2.5rem;
            }
            
            .couple-names {
                text-align: center;
                font-size: 1.8rem;
                margin-bottom: 50px;
            }
            
            .menu-section {
                margin-bottom: 40px;
            }
            
            .menu-section h2 {
                font-size: 1.8rem;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 10px;
            }
            
            .menu-items {
                list-style-type: none;
                padding: 0;
            }
            
            .menu-items li {
                padding: 8px 0;
                font-size: 1.1rem;
            }
            
            .back-link {
                display: block;
                text-align: center;
                margin-top: 40px;
                color: white;
                text-decoration: none;
                font-size: 1.1rem;
            }
            
            .back-link:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="menu-card">
                <h1>Menu Weselne</h1>
                <div class="couple-names">${coupleNames.bride} & ${coupleNames.groom}</div>
                
                ${menuItems.map(section => `
                    <div class="menu-section">
                        <h2>${section.name}</h2>
                        <ul class="menu-items">
                            ${section.items.map(item => `
                                <li>${item}</li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
                
                <a href="/" class="back-link">« Powrót do strony głównej</a>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // Send the generated HTML
    res.send(html);
    
  } catch (error) {
    const requestId = req.requestId || 'no-id';
    logError(error, 'Error serving menu page', requestId);
    res.status(500).send('Wystąpił błąd podczas wyświetlania menu.');
  }
});

// 🍸 DRINKS PAGE
app.get('/drinks', (req, res) => {
    logActivity('INFO', 'Drinks page accessed', '', req.requestId);
    
    const drinksSections = config.DRINKS.map(section => `
        <div class="drinks-section">
            <h2 class="section-title">${section.category}</h2>
            <div class="drink-grid">
                ${section.items.map(drink => `
                    <div class="drink-card">
                        <span class="drink-icon">${section.category.includes('Wina') ? '🍷' : '🥤'}</span>
                        <h3 class="drink-name">${drink}</h3>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    res.send(renderTemplate('drinks', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        DRINKS_SECTIONS: drinksSections,
        PAGE_TITLE: `Napoje - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// 🪑 SEATING PAGE
app.get('/seating', (req, res) => {
    logActivity('INFO', 'Seating page accessed', '', req.requestId);
    
    res.send(renderTemplate('seating', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        VENUE_NAME: config.VENUE,
        PAGE_TITLE: `Plan miejsc - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// 💕 OUR STORY PAGE
app.get('/story', (req, res) => {
    logActivity('INFO', 'Our story page accessed', '', req.requestId);
    
    const weddingDateFormatted = new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL', { 
        month: 'long', 
        year: 'numeric' 
    });
    
    res.send(renderTemplate('story', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        WEDDING_DATE_FORMATTED: weddingDateFormatted,
        PAGE_TITLE: `Nasza historia - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// ===== GALLERY API ENDPOINTS =====

// File upload storage configuration for gallery
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.originalname.toLowerCase().endsWith('.heic') ||
        file.originalname.toLowerCase().endsWith('.heif')) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: config.MAX_FILE_SIZE },
    fileFilter: fileFilter
});

// GET /api/gallery - Get all gallery items
app.get('/api/gallery', (req, res) => {
    try {
        // Read gallery data from JSON file
        const galleryPath = path.join(__dirname, 'data', 'gallery.json');
        
        if (!fs.existsSync(galleryPath)) {
            return res.json([]);
        }
        
        const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
        res.json(galleryData);
    } catch (error) {
        logError(error, 'Failed to get gallery items', req.requestId);
        res.status(500).json({ error: 'Failed to get gallery items' });
    }
});

// POST /api/upload - Upload photos and videos
app.post('/api/upload', upload.array('files'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { contributorName, message } = req.body;
        const fileTypes = req.body.fileTypes ? 
            (Array.isArray(req.body.fileTypes) ? req.body.fileTypes : [req.body.fileTypes]) : 
            [];
        
        logActivity('INFO', `Uploading ${req.files.length} files`, 
            `Contributor: ${contributorName}`, req.requestId);
        
        // Process each file and create thumbnails
        const galleryItems = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fileType = fileTypes[i] || 
                (file.mimetype.startsWith('image/') ? 'image' : 'video');
            
            // Generate thumbnail path
            const thumbnailFilename = `thumb_${path.basename(file.filename)}`;
            const thumbnailPath = path.join(config.UPLOADS_DIR, 'thumbnails', thumbnailFilename);
            
            // Generate thumbnail based on file type
            if (fileType === 'image' || file.mimetype.startsWith('image/')) {
                // Process image
                await sharp(file.path)
                    .resize(500, 500, { fit: 'cover' })
                    .toFile(thumbnailPath);
            } else if (fileType === 'video' || file.mimetype.startsWith('video/')) {
                // Process video thumbnail
                await new Promise((resolve, reject) => {
                    ffmpeg(file.path)
                        .screenshots({
                            timestamps: ['00:00:01.000'],
                            filename: thumbnailFilename,
                            folder: path.join(config.UPLOADS_DIR, 'thumbnails'),
                            size: '500x500'
                        })
                        .on('end', resolve)
                        .on('error', reject);
                });
            }
            
            // Add to gallery items
            galleryItems.push({
                id: uuidv4(),
                type: fileType === 'image' || file.mimetype.startsWith('image/') ? 'photo' : 'video',
                url: `/uploads/${file.filename}`,
                thumbnail: `/uploads/thumbnails/${thumbnailFilename}`,
                contributor: contributorName,
                message: message || null,
                filename: file.originalname,
                date: new Date().toISOString()
            });
        }
        
        // Save to gallery data file
        const galleryPath = path.join(__dirname, 'data', 'gallery.json');
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // Read existing gallery data
        let galleryData = [];
        if (fs.existsSync(galleryPath)) {
            galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
        }
        
        // Add new items and save
        galleryData = [...galleryData, ...galleryItems];
        fs.writeFileSync(galleryPath, JSON.stringify(galleryData, null, 2));
        
        logActivity('INFO', `Successfully uploaded ${req.files.length} files`, '', req.requestId);
        res.json({ success: true, items: galleryItems });
    } catch (error) {
        logError(error, 'Failed to upload files', req.requestId);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

// ===== ADMIN ROUTES (PROTECTED) =====

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

// API routes with longer timeout for uploads
app.use('/api', timeoutMiddleware(300000), apiRoutes); // 5 minutes for API

// Error handling
app.use('*', notFoundHandler);
app.use(errorHandler);

// Start the server
const server = app.listen(config.PORT, '0.0.0.0', () => {
    const startupMessage = `
🎉 MOBILE-FIRST WEDDING WEBSITE STARTED! (REFACTORED)

👰‍♀️ ${config.COUPLE_NAMES.bride} & 🤵‍♂️ ${config.COUPLE_NAMES.groom}
🌐 Domain: ${config.DOMAIN}
📅 Wedding Date: ${new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL')}

🔗 LOCAL URLS:
🏠 Main website: http://localhost:${config.PORT}
📸 Photo upload: http://localhost:${config.PORT}/photos
🍽️ Menu: http://localhost:${config.PORT}/menu
🍸 Drinks: http://localhost:${config.PORT}/drinks
🪑 Seating: http://localhost:${config.PORT}/seating
💕 Our story: http://localhost:${config.PORT}/story
🖼️ Gallery: http://localhost:${config.PORT}/gallery
🔐 Admin panel: http://localhost:${config.PORT}/admin

🔑 ADMIN LOGIN:
Password: ${config.ADMIN_PASSWORD}
(CHANGE THIS IMMEDIATELY!)

✨ REFACTOR IMPROVEMENTS:
- Clean, modular server.js (90% shorter!)
- HTML templates in separate files
- Template variable system
- Better maintainability
- Easier customization
- Combined photo and video gallery

📝 CREATE THESE TEMPLATE FILES:
views/home.html
views/upload.html
views/gallery.html
views/menu.html
views/drinks.html
views/seating.html
views/story.html
views/admin-login.html
views/admin-panel.html
    `;
    
    console.log(startupMessage);
    
    logActivity('SUCCESS', 'Refactored wedding website started', '', null, {
        port: config.PORT,
        domain: config.DOMAIN,
        templatesUsed: true
    });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Shutdown signal received: ${signal}`);
    console.log('📊 Server Statistics:');
    console.log(`   - Uptime: ${Math.floor(process.uptime())} seconds`);
    console.log(`   - Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    
    logActivity('INFO', 'Shutdown initiated', `Received ${signal}`, null, {
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage()
    });
    
    // Give some time for cleanup
    server.close((err) => {
        if (err) {
            logError(err, 'Error during server shutdown');
            console.error('❌ Error during shutdown:', err);
        } else {
            logActivity('SUCCESS', 'Wedding website closed gracefully');
            console.log('✅ Server shut down gracefully');
        }
        process.exit(err ? 1 : 0);
    });
    
    // Force exit after 10 seconds if server doesn't close
    setTimeout(() => {
        console.log('⏰ Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGINT', () => {
    console.log('\n⚠️  SIGINT received (Ctrl+C)');
    gracefulShutdown('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n⚠️  SIGTERM received');
    gracefulShutdown('SIGTERM');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    logError(error, 'Uncaught exception');
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    logError(new Error(`Unhandled Rejection: ${reason}`), 'Unhandled promise rejection');
    // Don't shutdown for unhandled rejections, just log them
});
module.exports = { app, server };