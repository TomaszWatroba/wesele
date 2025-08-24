// server.js - Fixed timeout configuration
const express = require('express');
const session = require('express-session');
const path = require('path');
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

// FIXED: Pass proper timeout value (30 seconds for regular requests)
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

// ===== MAIN WEBSITE ROUTES =====

// 🏠 HOME PAGE - Mobile-first landing
app.get('/', (req, res) => {
    logActivity('INFO', 'Home page accessed', '', req.requestId);
    res.send(generateHomePage(req));
});

// 📸 PHOTO UPLOAD - Mobile optimized
app.get('/photos', (req, res) => {
    logActivity('INFO', 'Photo upload page accessed', '', req.requestId);
    res.send(generatePhotoUploadPage(req));
});

// 🍽️ MENU PAGE
app.get('/menu', (req, res) => {
    logActivity('INFO', 'Menu page accessed', '', req.requestId);
    res.send(generateMenuPage(req));
});

// 🍸 DRINKS PAGE
app.get('/drinks', (req, res) => {
    logActivity('INFO', 'Drinks page accessed', '', req.requestId);
    res.send(generateDrinksPage(req));
});

// 🪑 SEATING PAGE
app.get('/seating', (req, res) => {
    logActivity('INFO', 'Seating page accessed', '', req.requestId);
    res.send(generateSeatingPage(req));
});

// 💕 OUR STORY PAGE
app.get('/story', (req, res) => {
    logActivity('INFO', 'Our story page accessed', '', req.requestId);
    res.send(generateStoryPage(req));
});

// ===== ADMIN ROUTES (PROTECTED) =====

// Admin login page
app.get('/admin/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.send(generateAdminLoginPage());
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
        res.send(generateAdminLoginPage('Invalid password. Please try again.'));
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
    res.send(generateAdminPanel(req));
});

// API routes with longer timeout for uploads
app.use('/api', timeoutMiddleware(300000), apiRoutes); // 5 minutes for API

// Error handling
app.use('*', notFoundHandler);
app.use(errorHandler);

// ===== PAGE GENERATORS =====
// [All the page generation functions remain the same as in the previous artifact]

function generateHomePage(req) {
    const baseUrl = config.getBaseURL(req);
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom} - Wesele</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }

        .hero {
            text-align: center;
            padding: 60px 20px 40px;
            background: linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.7));
            backdrop-filter: blur(10px);
        }

        .couple-names {
            font-size: 3rem;
            font-weight: 300;
            color: #d63384;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }

        .wedding-date {
            font-size: 1.2rem;
            color: #666;
            margin-bottom: 30px;
        }

        .heart {
            font-size: 2rem;
            color: #d63384;
            animation: heartbeat 2s ease-in-out infinite;
        }

        @keyframes heartbeat {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }

        .nav-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .nav-card {
            background: rgba(255,255,255,0.95);
            border-radius: 20px;
            padding: 30px;
            text-align: center;
            text-decoration: none;
            color: #333;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .nav-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
            border-color: #d63384;
        }

        .nav-card .icon {
            font-size: 3rem;
            margin-bottom: 15px;
            display: block;
        }

        .nav-card h3 {
            font-size: 1.5rem;
            margin-bottom: 10px;
            color: #d63384;
        }

        .nav-card p {
            color: #666;
            font-size: 0.95rem;
        }

        .photo-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .photo-card:hover {
            border-color: #667eea;
        }

        @media (max-width: 768px) {
            .couple-names {
                font-size: 2.5rem;
            }
            
            .nav-grid {
                grid-template-columns: 1fr;
                gap: 15px;
                padding: 15px;
            }
            
            .nav-card {
                padding: 25px;
            }
        }
    </style>
</head>
<body>
    <div class="hero">
        <div class="heart">💕</div>
        <h1 class="couple-names">${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</h1>
        <p class="wedding-date">🗓️ ${new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}</p>
    </div>

    <div class="nav-grid">
        <a href="/photos" class="nav-card photo-card">
            <span class="icon">📸</span>
            <h3>Podziel się zdjęciami</h3>
            <p>Dodaj swoje najpiękniejsze chwile z naszego wesela</p>
        </a>

        <a href="/menu" class="nav-card">
            <span class="icon">🍽️</span>
            <h3>Menu</h3>
            <p>Zobacz, co będziemy wspólnie delektować</p>
        </a>

        <a href="/drinks" class="nav-card">
            <span class="icon">🍸</span>
            <h3>Napoje</h3>
            <p>Koktajle, wina i specjalne mieszanki</p>
        </a>

        <a href="/seating" class="nav-card">
            <span class="icon">🪑</span>
            <h3>Plan miejsc</h3>
            <p>Znajdź swoje miejsce przy stole</p>
        </a>

        <a href="/story" class="nav-card">
            <span class="icon">💕</span>
            <h3>Nasza historia</h3>
            <p>Poznaj naszą drogę do miłości</p>
        </a>
    </div>
</body>
</html>`;
}

function generatePhotoUploadPage(req) {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Podziel się zdjęciami - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            padding: 20px;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .back-link {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
        }

        .back-link:hover {
            color: white;
        }

        .title {
            font-size: 2rem;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1rem;
            opacity: 0.9;
            margin-bottom: 30px;
        }

        .upload-area {
            border: 3px dashed rgba(255, 255, 255, 0.5);
            border-radius: 20px;
            padding: 50px 20px;
            text-align: center;
            margin: 20px 0;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .upload-area:hover,
        .upload-area.dragover {
            border-color: rgba(255, 255, 255, 0.8);
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }

        .upload-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            display: block;
        }

        .upload-text {
            font-size: 1.2rem;
            margin-bottom: 20px;
        }

        .upload-btn {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            color: #333;
            border: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }

        .upload-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.2);
        }

        .upload-btn:active {
            transform: translateY(-1px);
        }

        .file-input {
            display: none;
        }

        .progress-container {
            margin: 20px 0;
            display: none;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 4px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff9a9e, #fecfef);
            width: 0%;
            transition: width 0.3s ease;
        }

        .status {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            border-radius: 10px;
            font-weight: 500;
        }

        .status.success {
            background: rgba(40, 167, 69, 0.2);
            border: 1px solid rgba(40, 167, 69, 0.3);
        }

        .status.error {
            background: rgba(220, 53, 69, 0.2);
            border: 1px solid rgba(220, 53, 69, 0.3);
        }

        .status.info {
            background: rgba(23, 162, 184, 0.2);
            border: 1px solid rgba(23, 162, 184, 0.3);
        }

        .upload-tips {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            margin-top: 30px;
        }

        .tip {
            margin: 10px 0;
            font-size: 0.9rem;
            opacity: 0.9;
        }

        .uploaded-files {
            margin-top: 30px;
        }

        .file-item {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 15px;
            margin: 10px 0;
            display: flex;
            align-items: center;
        }

        .file-icon {
            font-size: 2rem;
            margin-right: 15px;
        }

        .file-details {
            flex: 1;
        }

        .file-name {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .file-size {
            font-size: 0.8rem;
            opacity: 0.7;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                padding: 20px;
            }

            .title {
                font-size: 1.8rem;
            }

            .upload-area {
                padding: 40px 15px;
            }

            .upload-icon {
                font-size: 3rem;
            }

            .upload-text {
                font-size: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">📸 Podziel się zdjęciami</h1>
            <p class="subtitle">Twoje wspomnienia uczynią nasze wesele jeszcze piękniejszym!</p>
        </div>

        <form id="uploadForm" enctype="multipart/form-data">
            <div class="upload-area" id="uploadArea">
                <span class="upload-icon">📱</span>
                <p class="upload-text">Przeciągnij i upuść zdjęcia tutaj</p>
                <p style="margin-bottom: 20px;">lub</p>
                <button type="button" class="upload-btn" onclick="document.getElementById('fileInput').click()">
                    Wybierz zdjęcia i filmy
                </button>
                <input type="file" id="fileInput" name="photos" multiple accept="image/*,video/*,.heic,.heif" class="file-input">
            </div>
        </form>

        <div class="progress-container" id="progressContainer">
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
        </div>

        <div class="status" id="status" style="display: none;"></div>

        <div class="uploaded-files" id="uploadedFiles"></div>

        <div class="upload-tips">
            <h3 style="margin-bottom: 15px;">💡 Wskazówki:</h3>
            <div class="tip">✅ Obsługujemy wszystkie formaty zdjęć i filmów</div>
            <div class="tip">📱 Zdjęcia HEIC z iPhone są w pełni obsługiwane</div>
            <div class="tip">🎬 Filmy mogą być do ${config.MAX_FILE_SIZE/1024/1024}MB</div>
            <div class="tip">⚡ Maksymalnie ${config.MAX_FILES_PER_UPLOAD} plików na raz</div>
            <div class="tip">🔒 Wszystkie pliki są bezpieczne i prywatne</div>
        </div>
    </div>

    <script>
        // Mobile-optimized upload functionality
        document.addEventListener('DOMContentLoaded', function() {
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const progressContainer = document.getElementById('progressContainer');
            const progressFill = document.getElementById('progressFill');
            const status = document.getElementById('status');
            const uploadedFiles = document.getElementById('uploadedFiles');

            // Drag and drop handlers
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, preventDefaults, false);
            });

            function preventDefaults(e) {
                e.preventDefault();
                e.stopPropagation();
            }

            ['dragenter', 'dragover'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                uploadArea.addEventListener(eventName, () => {
                    uploadArea.classList.remove('dragover');
                }, false);
            });

            uploadArea.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                handleFiles(files);
            }, false);

            fileInput.addEventListener('change', function() {
                handleFiles(this.files);
            });

            async function handleFiles(files) {
                if (files.length === 0) return;

                const formData = new FormData();
                const validFiles = [];

                // Validate files
                for (let file of files) {
                    const fileName = file.name.toLowerCase();
                    const fileType = file.type.toLowerCase();
                    
                    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'];
                    const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
                    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.heic', '.heif', '.mp4', '.mov', '.avi'];
                    
                    const hasValidMimeType = validImageTypes.includes(fileType) || validVideoTypes.includes(fileType);
                    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
                    const isEmptyMimeType = !fileType || fileType === 'application/octet-stream' || fileType === '';
                    
                    const isValidFile = hasValidMimeType || (hasValidExtension && (isEmptyMimeType || fileType === 'application/octet-stream'));
                    
                    if (!isValidFile) {
                        showStatus('Plik "' + file.name + '" nie jest obsługiwany. Tylko zdjęcia i filmy są dozwolone.', 'error');
                        return;
                    }
                    
                    validFiles.push(file);
                    formData.append('photos', file);
                }

                try {
                    progressContainer.style.display = 'block';
                    showStatus('Przesyłanie zdjęć... 📤', 'info');

                    // Simulate progress
                    let progress = 0;
                    const progressInterval = setInterval(() => {
                        progress += Math.random() * 15;
                        if (progress > 90) progress = 90;
                        progressFill.style.width = progress + '%';
                    }, 200);

                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    clearInterval(progressInterval);
                    progressFill.style.width = '100%';

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'HTTP ' + response.status);
                    }

                    const result = await response.json();
                    showStatus('🎉 Sukces! Przesłano ' + validFiles.length + ' plików!', 'success');
                    
                    displayUploadedFiles(result.files);
                    
                    setTimeout(() => {
                        progressContainer.style.display = 'none';
                        progressFill.style.width = '0%';
                    }, 2000);

                } catch (error) {
                    console.error('Upload error:', error);
                    showStatus('❌ Błąd przesyłania: ' + error.message, 'error');
                    progressContainer.style.display = 'none';
                }
            }

            function showStatus(message, type) {
                status.textContent = message;
                status.className = 'status ' + type;
                status.style.display = 'block';
                
                if (type === 'success') {
                    setTimeout(() => {
                        status.style.display = 'none';
                    }, 5000);
                }
            }

            function displayUploadedFiles(files) {
                if (!files || files.length === 0) return;
                
                const filesHTML = files.map(file => {
                    const isVideo = file.type && file.type.startsWith('video/');
                    const fileName = file.original || file.saved;
                    const fileSize = formatFileSize(file.size);
                    
                    return \`
                        <div class="file-item">
                            <span class="file-icon">\${isVideo ? '🎬' : '📷'}</span>
                            <div class="file-details">
                                <div class="file-name">\${fileName}</div>
                                <div class="file-size">\${fileSize}</div>
                            </div>
                            <span style="color: #4CAF50; font-size: 1.5rem;">✅</span>
                        </div>
                    \`;
                }).join('');
                
                uploadedFiles.innerHTML = 
                    '<h3 style="margin-bottom: 15px;">🎉 Przesłane pliki:</h3>' + filesHTML +
                    '<div style="text-align: center; margin-top: 20px;">' +
                        '<button onclick="location.reload()" class="upload-btn">Prześlij więcej plików</button>' +
                    '</div>';
            }
            
            function formatFileSize(bytes) {
                if (!bytes) return 'Nieznany rozmiar';
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
                return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
            }
        });
    </script>
</body>
</html>`;
}

function generateMenuPage(req) {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menu - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            min-height: 100vh;
            color: #333;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .back-link {
            color: #666;
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
            transition: color 0.3s ease;
        }

        .back-link:hover {
            color: #d63384;
        }

        .title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #d63384;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.1rem;
            color: #666;
            margin-bottom: 20px;
        }

        .menu-section {
            margin-bottom: 40px;
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }

        .section-title {
            font-size: 1.8rem;
            color: #d63384;
            margin-bottom: 20px;
            text-align: center;
            position: relative;
        }

        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #d63384, #fcb69f);
            border-radius: 2px;
        }

        .menu-item {
            background: rgba(255,255,255,0.8);
            border-radius: 15px;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #d63384;
            transition: all 0.3s ease;
        }

        .menu-item:hover {
            transform: translateX(5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }

        .item-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
        }

        .item-description {
            color: #666;
            line-height: 1.5;
            font-size: 0.95rem;
        }

        .dietary-info {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-radius: 15px;
            padding: 20px;
            margin-top: 30px;
            border: 1px solid #90caf9;
        }

        .dietary-title {
            font-size: 1.3rem;
            color: #1565c0;
            margin-bottom: 15px;
            text-align: center;
        }

        .dietary-item {
            margin: 10px 0;
            padding: 10px;
            background: rgba(255,255,255,0.7);
            border-radius: 10px;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                padding: 20px;
            }

            .title {
                font-size: 2rem;
            }

            .menu-section {
                padding: 20px;
                margin-bottom: 25px;
            }

            .section-title {
                font-size: 1.5rem;
            }

            .menu-item {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">🍽️ Menu</h1>
            <p class="subtitle">Smakowite dania przygotowane z miłością</p>
        </div>

        ${config.MENU_ITEMS.map(section => `
            <div class="menu-section">
                <h2 class="section-title">${section.name}</h2>
                ${section.items.map(item => `
                    <div class="menu-item">
                        <div class="item-name">${item}</div>
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <div class="dietary-info">
            <h3 class="dietary-title">🌱 Informacje dietetyczne</h3>
            <div class="dietary-item">
                <strong>Opcje wegetariańskie:</strong> Dostępne na życzenie
            </div>
            <div class="dietary-item">
                <strong>Alergie:</strong> Prosimy o wcześniejsze zgłoszenie
            </div>
            <div class="dietary-item">
                <strong>Dania bezglutenowe:</strong> Możliwe do przygotowania
            </div>
        </div>
    </div>
</body>
</html>`;
}

function generateDrinksPage(req) {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Napoje - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            padding: 20px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .back-link {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
            transition: color 0.3s ease;
        }

        .back-link:hover {
            color: white;
        }

        .title {
            font-size: 2.5rem;
            font-weight: 300;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }

        .drinks-section {
            margin-bottom: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }

        .section-title {
            font-size: 1.8rem;
            margin-bottom: 25px;
            text-align: center;
            position: relative;
        }

        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #ff9a9e, #fecfef);
            border-radius: 2px;
        }

        .drink-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
        }

        .drink-card {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }

        .drink-card:hover {
            transform: translateY(-5px);
            background: rgba(255, 255, 255, 0.2);
        }

        .drink-icon {
            font-size: 3rem;
            margin-bottom: 15px;
            display: block;
        }

        .drink-name {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .drink-description {
            font-size: 0.9rem;
            opacity: 0.8;
            line-height: 1.4;
        }

        .signature-drinks {
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            color: #333;
        }

        .signature-drinks .drink-card {
            background: rgba(255, 255, 255, 0.9);
            color: #333;
        }

        .bar-info {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 25px;
            margin-top: 30px;
            text-align: center;
        }

        .bar-hours {
            font-size: 1.2rem;
            margin-bottom: 15px;
        }

        .bar-note {
            font-size: 0.95rem;
            opacity: 0.8;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                padding: 20px;
            }

            .title {
                font-size: 2rem;
            }

            .drinks-section {
                padding: 20px;
                margin-bottom: 25px;
            }

            .drink-grid {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .drink-card {
                padding: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">🍸 Napoje</h1>
            <p class="subtitle">Koktajle, wina i specjalne mieszanki na nasz wyjątkowy dzień</p>
        </div>

        <div class="drinks-section signature-drinks">
            <h2 class="section-title">✨ Koktajle firmowe</h2>
            <div class="drink-grid">
                <div class="drink-card">
                    <span class="drink-icon">🍹</span>
                    <h3 class="drink-name">${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom} Spritz</h3>
                    <p class="drink-description">Nasz autorski koktajl z Prosecco, Aperol i nutą pomarańczy</p>
                </div>
                <div class="drink-card">
                    <span class="drink-icon">🌅</span>
                    <h3 class="drink-name">Sunset Love</h3>
                    <p class="drink-description">Romantyczny drink z wódką, sokiem żurawinowym i limonką</p>
                </div>
            </div>
        </div>

        ${config.DRINKS.map(section => `
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
        `).join('')}

        <div class="bar-info">
            <div class="bar-hours">🕐 Bar czynny: 18:00 - 02:00</div>
            <div class="bar-note">Nasi barmani z przyjemnością przygotują dla Państwa dowolny drink na życzenie!</div>
        </div>
    </div>
</body>
</html>`;
}

function generateSeatingPage(req) {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan miejsc - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
            min-height: 100vh;
            color: #333;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .back-link {
            color: #666;
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
            transition: color 0.3s ease;
        }

        .back-link:hover {
            color: #d63384;
        }

        .title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #d63384;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.1rem;
            color: #666;
        }

        .search-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 30px;
            text-align: center;
        }

        .search-input {
            width: 100%;
            max-width: 400px;
            padding: 15px 20px;
            border: 2px solid #dee2e6;
            border-radius: 50px;
            font-size: 1rem;
            background: white;
            transition: all 0.3s ease;
        }

        .search-input:focus {
            outline: none;
            border-color: #d63384;
            box-shadow: 0 0 0 3px rgba(214, 51, 132, 0.1);
        }

        .seating-layout {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }

        .layout-title {
            font-size: 1.5rem;
            color: #d63384;
            text-align: center;
            margin-bottom: 25px;
        }

        .tables-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .table {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border: 2px solid #dee2e6;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
        }

        .table:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-color: #d63384;
        }

        .table-number {
            font-size: 2rem;
            color: #d63384;
            font-weight: 700;
            margin-bottom: 10px;
        }

        .table-guests {
            font-size: 0.9rem;
            color: #666;
        }

        .guest-name {
            display: block;
            padding: 3px 0;
            transition: color 0.3s ease;
        }

        .guest-name.highlighted {
            color: #d63384;
            font-weight: 600;
        }

        .head-table {
            grid-column: 1 / -1;
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            border-color: #d63384;
        }

        .head-table .table-number {
            color: #d63384;
        }

        .venue-info {
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
            border-radius: 15px;
            padding: 20px;
            text-align: center;
            border: 1px solid #90caf9;
        }

        .venue-title {
            font-size: 1.3rem;
            color: #1565c0;
            margin-bottom: 15px;
        }

        .venue-details {
            color: #1976d2;
            line-height: 1.6;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
                padding: 20px;
            }

            .title {
                font-size: 2rem;
            }

            .tables-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }

            .table {
                padding: 15px;
            }

            .table-number {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">🪑 Plan miejsc</h1>
            <p class="subtitle">Znajdź swoje miejsce przy stole</p>
        </div>

        <div class="search-section">
            <input type="text" id="guestSearch" class="search-input" placeholder="Wpisz swoje imię i nazwisko...">
        </div>

        <div class="seating-layout">
            <h2 class="layout-title">Rozmieszczenie stołów</h2>
            
            <div class="tables-grid">
                <div class="table head-table">
                    <div class="table-number">👰🤵</div>
                    <div class="table-guests">
                        <span class="guest-name">Stół Młodej Pary</span>
                        <span class="guest-name">${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</span>
                        <span class="guest-name">Świadkowie</span>
                        <span class="guest-name">Rodzice</span>
                    </div>
                </div>

                <div class="table">
                    <div class="table-number">1</div>
                    <div class="table-guests">
                        <span class="guest-name">Anna Kowalska</span>
                        <span class="guest-name">Jan Kowalski</span>
                        <span class="guest-name">Maria Nowak</span>
                        <span class="guest-name">Piotr Nowak</span>
                        <span class="guest-name">Ewa Wiśniewska</span>
                        <span class="guest-name">Adam Wiśniewski</span>
                    </div>
                </div>

                <div class="table">
                    <div class="table-number">2</div>
                    <div class="table-guests">
                        <span class="guest-name">Magdalena Lewandowska</span>
                        <span class="guest-name">Robert Lewandowski</span>
                        <span class="guest-name">Katarzyna Wójcik</span>
                        <span class="guest-name">Michał Wójcik</span>
                        <span class="guest-name">Agnieszka Kowalczyk</span>
                        <span class="guest-name">Tomasz Kowalczyk</span>
                    </div>
                </div>

                <div class="table">
                    <div class="table-number">3</div>
                    <div class="table-guests">
                        <span class="guest-name">Joanna Kamińska</span>
                        <span class="guest-name">Paweł Kamiński</span>
                        <span class="guest-name">Monika Zielińska</span>
                        <span class="guest-name">Marcin Zieliński</span>
                        <span class="guest-name">Aleksandra Szymańska</span>
                        <span class="guest-name">Krzysztof Szymański</span>
                    </div>
                </div>

                <div class="table">
                    <div class="table-number">4</div>
                    <div class="table-guests">
                        <span class="guest-name">Natalia Dąbrowska</span>
                        <span class="guest-name">Łukasz Dąbrowski</span>
                        <span class="guest-name">Paulina Kozłowska</span>
                        <span class="guest-name">Grzegorz Kozłowski</span>
                        <span class="guest-name">Weronika Jankowska</span>
                        <span class="guest-name">Bartosz Jankowski</span>
                    </div>
                </div>

                <div class="table">
                    <div class="table-number">5</div>
                    <div class="table-guests">
                        <span class="guest-name">Karolina Mazur</span>
                        <span class="guest-name">Sebastian Mazur</span>
                        <span class="guest-name">Dominika Krawczyk</span>
                        <span class="guest-name">Mateusz Krawczyk</span>
                        <span class="guest-name">Izabela Piotrowski</span>
                        <span class="guest-name">Jakub Piotrowski</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="venue-info">
            <h3 class="venue-title">📍 Informacje o lokalu</h3>
            <div class="venue-details">
                <strong>${config.VENUE}</strong><br>
                Sala weselna - I piętro<br>
                Recepcja rozpoczyna się o 16:00<br>
                Kolacja o 18:00
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const searchInput = document.getElementById('guestSearch');
            const guestNames = document.querySelectorAll('.guest-name');

            searchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase().trim();
                
                guestNames.forEach(nameElement => {
                    const name = nameElement.textContent.toLowerCase();
                    
                    if (searchTerm && name.includes(searchTerm)) {
                        nameElement.classList.add('highlighted');
                        nameElement.closest('.table').style.order = '-1';
                        nameElement.closest('.table').style.transform = 'scale(1.05)';
                    } else {
                        nameElement.classList.remove('highlighted');
                        nameElement.closest('.table').style.order = '';
                        nameElement.closest('.table').style.transform = '';
                    }
                });

                if (!searchTerm) {
                    guestNames.forEach(nameElement => {
                        nameElement.closest('.table').style.order = '';
                        nameElement.closest('.table').style.transform = '';
                    });
                }
            });
        });
    </script>
</body>
</html>`;
}

function generateStoryPage(req) {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nasza historia - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
            min-height: 100vh;
            color: #333;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            padding: 40px 20px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .back-link {
            color: #666;
            text-decoration: none;
            font-size: 0.9rem;
            margin-bottom: 20px;
            display: inline-block;
            transition: color 0.3s ease;
        }

        .back-link:hover {
            color: #d63384;
        }

        .title {
            font-size: 2.5rem;
            font-weight: 300;
            color: #d63384;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 1.1rem;
            color: #666;
        }

        .story-timeline {
            position: relative;
        }

        .timeline-item {
            display: flex;
            margin-bottom: 40px;
            position: relative;
        }

        .timeline-item::before {
            content: '';
            position: absolute;
            left: 25px;
            top: 80px;
            bottom: -40px;
            width: 3px;
            background: linear-gradient(to bottom, #d63384, #fecfef);
            z-index: 1;
        }

        .timeline-item:last-child::before {
            display: none;
        }

        .timeline-dot {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #d63384 0%, #fecfef 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            margin-right: 30px;
            flex-shrink: 0;
            position: relative;
            z-index: 2;
            box-shadow: 0 8px 20px rgba(214, 51, 132, 0.3);
        }

        .timeline-content {
            flex: 1;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }

        .timeline-content:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .timeline-date {
            font-size: 0.9rem;
            color: #d63384;
            font-weight: 600;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .timeline-title {
            font-size: 1.5rem;
            color: #333;
            margin-bottom: 15px;
            font-weight: 600;
        }

        .timeline-description {
            color: #666;
            line-height: 1.6;
            font-size: 1rem;
        }

        .couple-photos {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }

        .photo-placeholder {
            aspect-ratio: 4/3;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: #d63384;
            border: 2px dashed #dee2e6;
            transition: all 0.3s ease;
        }

        .photo-placeholder:hover {
            transform: scale(1.02);
            border-color: #d63384;
        }

        .love-quote {
            background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin: 40px 0;
            box-shadow: 0 15px 30px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }

        .love-quote::before {
            content: '"';
            position: absolute;
            top: -20px;
            left: 30px;
            font-size: 8rem;
            color: rgba(214, 51, 132, 0.1);
            font-family: serif;
        }

        .quote-text {
            font-size: 1.3rem;
            color: #333;
            font-style: italic;
            line-height: 1.6;
            position: relative;
            z-index: 1;
        }

        .quote-author {
            font-size: 1rem;
            color: #d63384;
            margin-top: 20px;
            font-weight: 600;
        }

        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }

            .header {
                padding: 30px 20px;
                margin-bottom: 20px;
            }

            .title {
                font-size: 2rem;
            }

            .timeline-item {
                flex-direction: column;
                margin-bottom: 30px;
            }

            .timeline-item::before {
                display: none;
            }

            .timeline-dot {
                align-self: flex-start;
                margin-right: 0;
                margin-bottom: 15px;
            }

            .timeline-content {
                padding: 20px;
            }

            .couple-photos {
                grid-template-columns: 1fr;
                gap: 15px;
            }

            .love-quote {
                padding: 25px;
            }

            .quote-text {
                font-size: 1.1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="/" class="back-link">← Powrót do strony głównej</a>
            <h1 class="title">💕 Nasza historia</h1>
            <p class="subtitle">Droga do miłości i szczęścia</p>
        </div>

        <div class="story-timeline">
            <div class="timeline-item">
                <div class="timeline-dot">👫</div>
                <div class="timeline-content">
                    <div class="timeline-date">Czerwiec 2020</div>
                    <h3 class="timeline-title">Pierwsze spotkanie</h3>
                    <p class="timeline-description">
                        To było magiczne lato. Spotkaliśmy się na wspólnych znajomych podczas grilla. 
                        Od pierwszej chwili wiedzieliśmy, że to coś więcej niż zwykła znajomość. 
                        Rozmawialiśmy do białego rana o wszystkim i o niczym.
                    </p>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot">❤️</div>
                <div class="timeline-content">
                    <div class="timeline-date">Sierpień 2020</div>
                    <h3 class="timeline-title">Pierwsza randka</h3>
                    <p class="timeline-description">
                        Oficjalna pierwsza randka w małej restauracji nad jeziorem. 
                        ${config.COUPLE_NAMES.groom} był tak zdenerwowany, że przewrócił kieliszek z winem! 
                        To był moment, kiedy ${config.COUPLE_NAMES.bride} wiedziała, że to ten jedyny.
                    </p>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot">🏠</div>
                <div class="timeline-content">
                    <div class="timeline-date">Maj 2022</div>
                    <h3 class="timeline-title">Wspólne mieszkanie</h3>
                    <p class="timeline-description">
                        Po dwóch latach związku zdecydowaliśmy się zamieszkać razem. 
                        Pierwszy dzień w nowym mieszkaniu spędziliśmy na składaniu mebli z IKEA - 
                        i nadal jesteśmy razem, więc to musi być prawdziwa miłość! 😄
                    </p>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot">💍</div>
                <div class="timeline-content">
                    <div class="timeline-date">Grudzień 2024</div>
                    <h3 class="timeline-title">Oświadczyny</h3>
                    <p class="timeline-description">
                        W wigilijny wieczór, przy choince, ${config.COUPLE_NAMES.groom} padł na kolano. 
                        ${config.COUPLE_NAMES.bride} była tak zaskoczona, że przez chwilę myślała, 
                        że przewrócił się! Pierścionek był idealny - dokładnie taki, o jakim marzyła.
                    </p>
                </div>
            </div>

            <div class="timeline-item">
                <div class="timeline-dot">💒</div>
                <div class="timeline-content">
                    <div class="timeline-date">${new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}</div>
                    <h3 class="timeline-title">Nasz wielki dzień!</h3>
                    <p class="timeline-description">
                        Dziś rozpoczynamy nowy rozdział jako mąż i żona. 
                        Dziękujemy, że jesteście z nami w tym wyjątkowym dniu i dzielicie nasze szczęście!
                    </p>
                </div>
            </div>
        </div>

        <div class="couple-photos">
            <div class="photo-placeholder">📸</div>
            <div class="photo-placeholder">📷</div>
            <div class="photo-placeholder">💕</div>
        </div>

        <div class="love-quote">
            <p class="quote-text">
                Miłość to nie tylko patrzenie na siebie nawzajem, to patrzenie razem w tym samym kierunku.
            </p>
            <p class="quote-author">— Antoine de Saint-Exupéry</p>
        </div>
    </div>
</body>
</html>`;
}

function generateAdminLoginPage(error = '') {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel administratora - Logowanie</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }

        .login-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(15px);
            border-radius: 25px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }

        .title {
            font-size: 2rem;
            margin-bottom: 10px;
            font-weight: 300;
        }

        .subtitle {
            opacity: 0.9;
            margin-bottom: 30px;
        }

        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .form-input {
            width: 100%;
            padding: 15px;
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 1rem;
            transition: all 0.3s ease;
        }

        .form-input:focus {
            outline: none;
            border-color: rgba(255,255,255,0.5);
            background: rgba(255,255,255,0.15);
        }

        .form-input::placeholder {
            color: rgba(255,255,255,0.7);
        }

        .login-btn {
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
            color: #333;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }

        .error-message {
            background: rgba(220, 53, 69, 0.2);
            border: 1px solid rgba(220, 53, 69, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 20px;
            color: #ff6b6b;
        }

        .back-link {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            font-size: 0.9rem;
            margin-top: 20px;
            display: inline-block;
        }

        .back-link:hover {
            color: white;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1 class="title">🔐 Panel administratora</h1>
        <p class="subtitle">Zaloguj się, aby zarządzać stroną wesela</p>
        
        ${error ? `<div class="error-message">${error}</div>` : ''}
        
        <form method="POST" action="/admin/login">
            <div class="form-group">
                <label for="password" class="form-label">Hasło:</label>
                <input type="password" id="password" name="password" class="form-input" placeholder="Wprowadź hasło administratora" required>
            </div>
            
            <button type="submit" class="login-btn">Zaloguj się</button>
        </form>
        
        <a href="/" class="back-link">← Powrót do strony głównej</a>
    </div>
</body>
</html>`;
}

function generateAdminPanel(req) {
    return `
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel administratora - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            color: #333;
            padding: 20px;
        }

        .header {
            background: white;
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 30px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .title {
            font-size: 1.8rem;
            color: #333;
        }

        .logout-btn {
            background: #dc3545;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 0.9rem;
            transition: all 0.3s ease;
        }

        .logout-btn:hover {
            background: #c82333;
            transform: translateY(-1px);
        }

        .admin-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .admin-section {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        }

        .section-title {
            font-size: 1.3rem;
            color: #333;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
        }

        .section-title .icon {
            margin-right: 10px;
            font-size: 1.5rem;
        }

        .btn {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            margin: 5px;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn:hover {
            background: #0056b3;
            transform: translateY(-1px);
        }

        .btn.success {
            background: #28a745;
        }

        .btn.success:hover {
            background: #1e7e34;
        }

        .btn.download {
            background: #6c757d;
        }

        .btn.download:hover {
            background: #545b62;
        }

        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
        }

        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }

        .status-indicator.active {
            background: #28a745;
            animation: pulse 2s infinite;
        }

        .status-indicator.inactive {
            background: #dc3545;
        }

        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }

        .info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            word-break: break-all;
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            background: #f8f9fa;
        }

        .gallery-item {
            background: white;
            border-radius: 8px;
            padding: 10px;
            border: 1px solid #eee;
            text-align: center;
            transition: transform 0.2s ease;
        }

        .gallery-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .file-preview {
            width: 100%;
            height: 100px;
            background: #f0f0f0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin-bottom: 8px;
            overflow: hidden;
        }

        .file-preview img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 6px;
        }

        .file-name {
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 4px;
            word-break: break-word;
        }

        .file-details {
            font-size: 0.7rem;
            color: #666;
            margin-bottom: 8px;
        }

        .loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255,255,255,.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 1s ease-in-out infinite;
            margin-right: 8px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
            .header {
                flex-direction: column;
                text-align: center;
                gap: 15px;
            }

            .admin-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }

            .gallery-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">🎉 Panel administratora - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}</h1>
        <a href="/admin/logout" class="logout-btn">Wyloguj się</a>
    </div>

    <div class="admin-grid">
        <!-- Connection Status Section -->
        <div class="admin-section">
            <h2 class="section-title">
                <span class="icon">🌐</span>
                Status połączenia
            </h2>
            <div style="margin: 15px 0;">
                <span class="status-indicator inactive" id="statusIndicator"></span>
                <span id="statusText">Sprawdzanie połączenia...</span>
            </div>
            <div class="info-box" id="currentUrl">Ładowanie...</div>
            <button class="btn" id="refreshBtn" onclick="checkStatus()">
                🔄 Odśwież status
            </button>
        </div>

        <!-- QR Code Generator Section -->
        <div class="admin-section">
            <h2 class="section-title">
                <span class="icon">📱</span>
                Generator kodów QR
            </h2>
            <div style="margin: 20px 0;">
                <button class="btn success" id="generateBtn" onclick="generateQR()">
                    📷 Wygeneruj kod QR
                </button>
                <button class="btn download" id="downloadBtn" onclick="downloadQR()" disabled>
                    💾 Pobierz PNG
                </button>
            </div>
            
            <div id="qrDisplay" style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; min-height: 100px; display: flex; align-items: center; justify-content: center;">
                <p style="color: #666;">Kliknij "Wygeneruj kod QR" aby utworzyć kod</p>
            </div>
            
            <div id="qrInfo" style="display: none; margin-top: 15px;">
                <p><strong>URL kodu QR:</strong> <span id="qrUrl"></span></p>
                <p style="font-size: 0.9rem; color: #666; margin-top: 10px;">
                    Udostępnij ten kod QR gościom, aby mogli łatwo przesyłać zdjęcia!
                </p>
            </div>
        </div>

        <!-- Files Gallery Section -->
        <div class="admin-section" style="grid-column: 1 / -1;">
            <h2 class="section-title">
                <span class="icon">🖼️</span>
                Galeria zdjęć
            </h2>
            <div style="margin: 20px 0; display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
                <button class="btn" id="refreshGalleryBtn" onclick="loadGallery()">
                    🔄 Odśwież galerię
                </button>
                <button class="btn download" id="downloadAllBtn" onclick="downloadAll()">
                    📦 Pobierz wszystko
                </button>
                <div style="margin-left: auto; font-size: 0.9rem; color: #666;" id="galleryStats">
                    Ładowanie plików...
                </div>
            </div>
            
            <div class="gallery-grid" id="galleryGrid">
                <p>Kliknij "Odśwież galerię" aby załadować przesłane pliki...</p>
            </div>
        </div>
    </div>

    <script>
        // Global variables
        let currentQRData = null;

        // Initialize admin panel
        document.addEventListener('DOMContentLoaded', function() {
            checkStatus();
            loadGallery();
            
            // Auto-refresh every 30 seconds
            setInterval(checkStatus, 30000);
        });

        async function checkStatus() {
            const refreshBtn = document.getElementById('refreshBtn');
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            const currentUrl = document.getElementById('currentUrl');

            try {
                refreshBtn.innerHTML = '<div class="loading"></div>Sprawdzanie...';
                refreshBtn.disabled = true;
                
                statusText.textContent = 'Sprawdzanie połączenia...';
                statusIndicator.className = 'status-indicator inactive';

                const response = await fetch('/api/public-url');
                
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }

                const data = await response.json();
                
                const isTunnelActive = data.tunnelActive;
                statusIndicator.className = isTunnelActive ? 'status-indicator active' : 'status-indicator inactive';
                statusText.textContent = isTunnelActive ? 
                    'Tunel Cloudflare aktywny' : 
                    'Brak tunelu - tylko lokalny dostęp';
                
                currentUrl.textContent = data.uploadURL;

            } catch (error) {
                console.error('Status check failed:', error);
                statusIndicator.className = 'status-indicator inactive';
                statusText.textContent = 'Błąd sprawdzania połączenia';
                currentUrl.textContent = 'Błąd ładowania URL';
            } finally {
                refreshBtn.innerHTML = '🔄 Odśwież status';
                refreshBtn.disabled = false;
            }
        }

        async function generateQR() {
            const generateBtn = document.getElementById('generateBtn');
            const downloadBtn = document.getElementById('downloadBtn');
            const qrDisplay = document.getElementById('qrDisplay');
            const qrInfo = document.getElementById('qrInfo');
            const qrUrl = document.getElementById('qrUrl');

            try {
                generateBtn.innerHTML = '<div class="loading"></div>Generowanie...';
                generateBtn.disabled = true;
                
                qrDisplay.innerHTML = '<div class="loading"></div><p>Generowanie kodu QR...</p>';

                const response = await fetch('/api/qr-upload');
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'HTTP ' + response.status);
                }
                
                const result = await response.json();

                if (result.success) {
                    qrDisplay.innerHTML = '<img src="' + result.qrCode + '" alt="Upload QR Code" style="max-width: 256px; border: 1px solid #ddd; border-radius: 8px;">';
                    qrUrl.textContent = result.uploadUrl;
                    qrInfo.style.display = 'block';
                    
                    currentQRData = {
                        dataURL: result.qrCode,
                        url: result.uploadUrl
                    };
                    
                    downloadBtn.disabled = false;
                } else {
                    throw new Error(result.error || 'Generowanie QR nie powiodło się');
                }
            } catch (error) {
                console.error('QR generation failed:', error);
                qrDisplay.innerHTML = '<div style="color: #dc3545;"><p>Nie udało się wygenerować kodu QR</p><p style="font-size: 0.9rem;">' + error.message + '</p></div>';
            } finally {
                generateBtn.innerHTML = '📷 Wygeneruj kod QR';
                generateBtn.disabled = false;
            }
        }

        function downloadQR() {
            if (!currentQRData) {
                alert('Brak kodu QR do pobrania');
                return;
            }

            try {
                const link = document.createElement('a');
                link.download = 'wesele-qr-' + Date.now() + '.png';
                link.href = currentQRData.dataURL;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Download failed:', error);
                alert('Błąd pobierania: ' + error.message);
            }
        }

        async function loadGallery() {
            const refreshBtn = document.getElementById('refreshGalleryBtn');
            const galleryGrid = document.getElementById('galleryGrid');
            const galleryStats = document.getElementById('galleryStats');
            
            try {
                refreshBtn.innerHTML = '<div class="loading"></div>Ładowanie...';
                refreshBtn.disabled = true;
                
                galleryGrid.innerHTML = '<p>Ładowanie plików...</p>';
                galleryStats.textContent = 'Ładowanie...';
                
                const response = await fetch('/api/files');
                
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status);
                }
                
                const files = await response.json();
                
                if (files.length === 0) {
                    galleryGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">Brak przesłanych plików. Udostępnij kod QR gościom!</p>';
                    galleryStats.textContent = 'Brak plików';
                    return;
                }
                
                const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
                galleryStats.innerHTML = files.length + ' plików • ' + formatFileSize(totalSize);
                
                const galleryHTML = files.map(function(file) {
                    const fileName = file.name || 'Nieznany plik';
                    const fileSize = formatFileSize(file.size || 0);
                    const fileDate = new Date(file.created).toLocaleDateString('pl-PL');
                    const fileExt = fileName.split('.').pop().toLowerCase();
                    
                    const isImage = file.type && file.type.startsWith('image/');
                    const isVideo = file.type && file.type.startsWith('video/');
                    const isHEIC = ['heic', 'heif'].includes(fileExt);
                    
                    let previewContent;
                    if (isImage) {
                        previewContent = '<img src="/uploads/' + encodeURIComponent(file.name) + '" alt="' + fileName + '" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'" onload="this.nextElementSibling.style.display=\'none\'"><div style="display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #666;">' + (isHEIC ? '🎞️' : '📷') + '</div>';
                    } else if (isVideo) {
                        previewContent = '<div style="display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #666; flex-direction: column;"><span>🎬</span><div style="font-size: 0.7rem; margin-top: 5px;">.' + fileExt.toUpperCase() + '</div></div>';
                    } else {
                        previewContent = '<div style="display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #666; flex-direction: column;"><span>📄</span><div style="font-size: 0.7rem; margin-top: 5px;">.' + fileExt.toUpperCase() + '</div></div>';
                    }
                    
                    return '<div class="gallery-item">' +
                        '<div class="file-preview" onclick="viewFile(\'' + file.name + '\', \'' + (isVideo ? 'video' : 'image') + '\')">' +
                            previewContent +
                        '</div>' +
                        '<div class="file-name" title="' + fileName + '">' +
                            (fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName) +
                        '</div>' +
                        '<div class="file-details">' +
                            fileSize + ' • ' + fileDate +
                        '</div>' +
                    '</div>';
                }).join('');
                
                galleryGrid.innerHTML = galleryHTML;
                
            } catch (error) {
                console.error('Gallery load failed:', error);
                galleryGrid.innerHTML = '<p style="color: #dc3545;">Błąd ładowania galerii. Spróbuj ponownie.</p>';
                galleryStats.textContent = 'Błąd ładowania plików';
            } finally {
                refreshBtn.innerHTML = '🔄 Odśwież galerię';
                refreshBtn.disabled = false;
            }
        }

        async function downloadAll() {
            const downloadBtn = document.getElementById('downloadAllBtn');
            
            try {
                downloadBtn.innerHTML = '<div class="loading"></div>Tworzenie ZIP...';
                downloadBtn.disabled = true;
                
                const link = document.createElement('a');
                link.href = '/api/download-all';
                link.download = 'wesele-zdjecia.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
            } catch (error) {
                console.error('Download failed:', error);
                alert('Błąd pobierania: ' + error.message);
            } finally {
                downloadBtn.innerHTML = '📦 Pobierz wszystko';
                downloadBtn.disabled = false;
            }
        }

        function viewFile(filename, type) {
            if (!filename) return;
            
            const modal = document.createElement('div');
            modal.style.cssText = 
                'position: fixed; top: 0; left: 0; width: 100%; height: 100%; ' +
                'background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; ' +
                'justify-content: center; z-index: 1000; cursor: pointer;';
            
            const container = document.createElement('div');
            container.style.cssText = 
                'max-width: 90%; max-height: 90%; text-align: center; position: relative;';
            
            let mediaElement;
            
            if (type === 'video') {
                mediaElement = document.createElement('video');
                mediaElement.src = '/uploads/' + encodeURIComponent(filename);
                mediaElement.controls = true;
                mediaElement.autoplay = true;
                mediaElement.style.cssText = 
                    'max-width: 100%; max-height: 100%; border-radius: 8px;';
            } else {
                mediaElement = document.createElement('img');
                mediaElement.src = '/uploads/' + encodeURIComponent(filename);
                mediaElement.alt = filename;
                mediaElement.style.cssText = 
                    'max-width: 100%; max-height: 100%; border-radius: 8px;';
            }
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = 
                'position: absolute; top: -10px; right: -10px; background: rgba(255, 255, 255, 0.9); ' +
                'border: none; border-radius: 50%; width: 40px; height: 40px; font-size: 20px; ' +
                'cursor: pointer; color: #333;';
            
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                if (type === 'video' && mediaElement.pause) {
                    mediaElement.pause();
                }
                document.body.removeChild(modal);
            };
            
            container.appendChild(mediaElement);
            container.appendChild(closeBtn);
            modal.appendChild(container);
            
            modal.onclick = function(e) {
                if (e.target === modal) {
                    if (type === 'video' && mediaElement.pause) {
                        mediaElement.pause();
                    }
                    document.body.removeChild(modal);
                }
            };
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    if (type === 'video' && mediaElement.pause) {
                        mediaElement.pause();
                    }
                    document.body.removeChild(modal);
                }
            });
            
            document.body.appendChild(modal);
        }
        
        function formatFileSize(bytes) {
            if (!bytes) return '0 B';
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
            return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
        }
    </script>
</body>
</html>`;
}

// Start the server
const server = app.listen(config.PORT, '0.0.0.0', () => {
    const startupMessage = `
🎉 MOBILE-FIRST WEDDING WEBSITE STARTED!

👰‍♀️ ${config.COUPLE_NAMES.bride} & 🤵‍♂️ ${config.COUPLE_NAMES.groom}
🌐 Domain: ${config.DOMAIN}
📅 Wedding Date: ${new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL')}

🔗 LOCAL URLS:
🏠 Main website: http://localhost:${config.PORT}
📸 Photo upload: http://localhost:${config.PORT}/photos
🔐 Admin panel: http://localhost:${config.PORT}/admin

🔒 ADMIN LOGIN:
Password: ${config.ADMIN_PASSWORD}
(CHANGE THIS IMMEDIATELY!)

✅ FIXES APPLIED:
- Fixed timeout middleware configuration
- Added favicon.ico handler
- Improved error handling
- Enhanced monitoring stability
    `;
    
    console.log(startupMessage);
    
    logActivity('SUCCESS', 'Fixed wedding website started', '', null, {
        port: config.PORT,
        domain: config.DOMAIN
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