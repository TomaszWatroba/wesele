// server.js - Clean and modular wedding website server
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
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

const app = express();

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
    logActivity('SUCCESS', 'Wedding website directories initialized');
} catch (error) {
    logError(error, 'Failed to initialize directories');
    process.exit(1);
}

// Session configuration for admin authentication
app.use(session({
    secret: config.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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
    
    res.send(renderTemplate('photos', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        MAX_FILE_SIZE: config.MAX_FILE_SIZE / 1024 / 1024,
        MAX_FILES: config.MAX_FILES_PER_UPLOAD,
        PAGE_TITLE: `Podziel się zdjęciami - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// 🍽️ MENU PAGE
app.get('/menu', (req, res) => {
    logActivity('INFO', 'Menu page accessed', '', req.requestId);
    
    const menuSections = config.MENU_ITEMS.map(section => `
        <div class="menu-section">
            <h2 class="section-title">${section.name}</h2>
            ${section.items.map(item => `
                <div class="menu-item">
                    <div class="item-name">${item}</div>
                </div>
            `).join('')}
        </div>
    `).join('');
    
    res.send(renderTemplate('menu', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        MENU_SECTIONS: menuSections,
        PAGE_TITLE: `Menu - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// 🍸 DRINKS PAGE
// Then update the drinks route:
app.get('/drinks', (req, res) => {
  try {
    const requestId = req.requestId || 'no-id';
    logActivity('INFO', 'Drinks page accessed', '', requestId);
    
    // Get couple names from config
    const coupleNames = config.COUPLE_NAMES || { bride: 'Gosia', groom: 'Tomek' };
    
    // Generate HTML from the drinks items
    let html = `
    <!DOCTYPE html>
    <html lang="pl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Menu napojów - ${coupleNames.bride} & ${coupleNames.groom}</title>
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
            
            .drinks-card {
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
            
            .drinks-section {
                margin-bottom: 40px;
            }
            
            .drinks-section h2 {
                font-size: 1.8rem;
                margin-bottom: 15px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                padding-bottom: 10px;
            }
            
            .drinks-items {
                list-style-type: none;
                padding: 0;
            }
            
            .drinks-items li {
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
            <div class="drinks-card">
                <h1>Menu Napojów</h1>
                <div class="couple-names">${coupleNames.bride} & ${coupleNames.groom}</div>
                
                ${drinksItems.map(section => `
                    <div class="drinks-section">
                        <h2>${section.name}</h2>
                        <ul class="drinks-items">
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
    logError(error, 'Error serving drinks page', requestId);
    res.status(500).send('Wystąpił błąd podczas wyświetlania menu napojów.');
  }
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
🔐 Admin panel: http://localhost:${config.PORT}/admin

🔒 ADMIN LOGIN:
Password: ${config.ADMIN_PASSWORD}
(CHANGE THIS IMMEDIATELY!)

✨ REFACTOR IMPROVEMENTS:
- Clean, modular server.js (90% shorter!)
- HTML templates in separate files
- Template variable system
- Better maintainability
- Easier customization

📁 CREATE THESE TEMPLATE FILES:
views/home.html
views/photos.html
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
    logActivity('INFO', 'Shutdown initiated', `Received ${signal}`);
    server.close((err) => {
        if (err) {
            logError(err, 'Error during server shutdown');
        } else {
            logActivity('SUCCESS', 'Wedding website closed gracefully');
        }
        process.exit(0);
    });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = { app, server };