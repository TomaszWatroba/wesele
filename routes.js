const express = require('express');
const config = require('./config');
const router = express.Router();

router.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Panel</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📸</text></svg>">
<style>
body{font-family:Arial;padding:20px;background:#667eea}
.container{max-width:800px;margin:0 auto;background:white;padding:30px;border-radius:20px}
.header{text-align:center;background:#ff6b6b;color:white;padding:20px;border-radius:10px;margin-bottom:20px}
.btn{background:#007bff;color:white;padding:15px 25px;border:none;border-radius:25px;margin:10px;text-decoration:none;display:inline-block;cursor:pointer}
.btn.green{background:#28a745}
.btn.qr{background:#ff6b6b}
.section{background:#f8f9fa;padding:20px;border-radius:10px;margin:20px 0;text-align:center}
.url-box{background:#e9ecef;padding:10px;border-radius:5px;margin:10px 0;font-family:monospace;word-break:break-all;font-size:14px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin:20px 0}
.stat{background:#48cae4;color:white;padding:20px;border-radius:10px;text-align:center}
.stat-num{font-size:2em;font-weight:bold}
.gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.photo{border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)}
.photo img,.photo video{width:100%;height:100px;object-fit:cover}
.qr-container{text-align:center;margin:20px 0}
.qr-loading{color:#666;font-style:italic}
.url-info{background:#e3f2fd;padding:15px;border-radius:10px;margin:15px 0;border-left:4px solid #2196f3}
.url-info h4{margin:0 0 10px 0;color:#1976d2}
.error{background:#ffebee;color:#c62828;padding:15px;border-radius:10px;margin:10px 0}
</style>
</head>
<body>
<div class="container">
<div class="header">
<h1>📸 ${config.EVENT_NAME}</h1>
<p>Panel Organizatora</p>
</div>

<div style="background:#e8f5e8;padding:15px;border-radius:10px;margin-bottom:20px">
<strong>✨ Bez haseł - maksymalna prostota!</strong><br>
Goście wchodzą na link → przesyłają pliki → wszystko zapisuje się bezpiecznie
</div>

<div class="section">
<h3>📱 Strona dla gości</h3>

<div class="url-info">
<h4>🌐 Aktualne URL-e:</h4>
<div><strong>Lokalny:</strong> <span id="local-url">http://localhost:${config.PORT}/upload</span></div>
<div><strong>Publiczny:</strong> <span id="public-url">Sprawdzanie...</span></div>
</div>

<div class="url-box" id="guest-url">http://localhost:${config.PORT}/upload</div>
<button class="btn" onclick="copyLink()">📋 Kopiuj link</button>
<a href="/upload" class="btn green">📱 Idź do upload</a>
<button class="btn" onclick="location.href='/api/download-all'">📥 Pobierz ZIP</button>

<div class="qr-container">
<button class="btn qr" onclick="generateQR()">📱 Generuj QR kod</button>
<button class="btn" onclick="downloadQR()" style="display:none" id="download-qr-btn">📥 Pobierz QR (PNG)</button>
<div id="qr-status" class="qr-loading" style="display:none">Generowanie QR kodu...</div>
<div id="qr-error" class="error" style="display:none"></div>
<div id="qr-code"></div>
</div>
</div>

<div class="stats">
<div class="stat"><div class="stat-num" id="photos">0</div><div>Zdjęć</div></div>
<div class="stat"><div class="stat-num" id="videos">0</div><div>Filmów</div></div>
<div class="stat"><div class="stat-num" id="size">0</div><div>MB</div></div>
<div class="stat"><div class="stat-num" id="total">0</div><div>Razem</div></div>
</div>

<h3>📷 Galeria</h3>
<div class="gallery" id="gallery"></div>
</div>

<script>
console.log('🏠 Admin panel JavaScript starting...');

// Global variables to store current URLs
let currentLocalUrl = 'http://localhost:${config.PORT}/upload';
let currentPublicUrl = '';

// Function to detect current public URL
async function detectPublicUrl() {
    try {
        console.log('🌐 Detecting public URL...');
        const response = await fetch('/api/public-url');
        if (response.ok) {
            const urlInfo = await response.json();
            console.log('🔍 URL detection result:', urlInfo);
            
            currentLocalUrl = urlInfo.uploadURL || 'http://localhost:${config.PORT}/upload';
            currentPublicUrl = urlInfo.uploadURL;
            
            // Update display
            document.getElementById('local-url').textContent = 'http://localhost:${config.PORT}/upload';
            
            if (urlInfo.isTunnel) {
                document.getElementById('public-url').innerHTML = '<strong style="color:green">' + urlInfo.uploadURL + '</strong> ✅ Tunnel aktywny!';
                document.getElementById('guest-url').textContent = urlInfo.uploadURL;
            } else {
                document.getElementById('public-url').innerHTML = '<span style="color:#ff9800">Brak tunelu - tylko lokalnie</span>';
                document.getElementById('guest-url').textContent = currentLocalUrl;
            }
            
            return urlInfo.uploadURL;
        } else {
            console.error('❌ Failed to detect URL:', response.status);
            return currentLocalUrl;
        }
    } catch (error) {
        console.error('❌ URL detection error:', error);
        document.getElementById('public-url').innerHTML = '<span style="color:red">Błąd sprawdzania URL</span>';
        return currentLocalUrl;
    }
}

// Function to generate QR code
async function generateQR() {
    console.log('📱 QR generation requested...');
    
    const statusDiv = document.getElementById('qr-status');
    const errorDiv = document.getElementById('qr-error');
    const qrDiv = document.getElementById('qr-code');
    const downloadBtn = document.getElementById('download-qr-btn');
    
    // Show loading state
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Generowanie QR kodu...';
    errorDiv.style.display = 'none';
    qrDiv.innerHTML = '';
    downloadBtn.style.display = 'none';
    
    try {
        // First detect the current URL
        const targetUrl = await detectPublicUrl();
        console.log('🎯 Target URL for QR:', targetUrl);
        
        statusDiv.textContent = 'Tworzenie QR kodu...';
        
        // Generate QR code
        const qrResponse = await fetch('/api/qr?url=' + encodeURIComponent(targetUrl));
        
        if (qrResponse.ok) {
            const qrDataUrl = await qrResponse.text();
            console.log('✅ QR code generated successfully');
            
            // Display QR code
            qrDiv.innerHTML = '<img src="' + qrDataUrl + '" style="max-width:300px;margin:10px 0;border:2px solid #ddd;border-radius:10px;box-shadow: 0 4px 8px rgba(0,0,0,0.1)"><br><small style="color:#666">Skanuj aby przejść do: ' + targetUrl + '</small>';
            
            // Show download button
            downloadBtn.style.display = 'inline-block';
            
            // Hide loading
            statusDiv.style.display = 'none';
            
        } else {
            throw new Error('HTTP ' + qrResponse.status + ' - ' + qrResponse.statusText);
        }
        
    } catch (error) {
        console.error('❌ QR generation failed:', error);
        
        statusDiv.style.display = 'none';
        errorDiv.style.display = 'block';
        errorDiv.innerHTML = '<strong>Błąd generowania QR kodu:</strong><br>' + error.message + '<br><small>Sprawdź konsolę deweloperską (F12) aby zobaczyć więcej szczegółów.</small>';
    }
}

// Function to download QR code as PNG
async function downloadQR() {
    try {
        console.log('📥 QR download requested...');
        const targetUrl = document.getElementById('guest-url').textContent;
        
        const response = await fetch('/api/qr-download?url=' + encodeURIComponent(targetUrl));
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'qr-code-${config.EVENT_NAME.replace(/\s+/g, '-')}.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            console.log('✅ QR code downloaded');
        } else {
            alert('Błąd pobierania QR kodu');
        }
    } catch (error) {
        console.error('❌ QR download error:', error);
        alert('Błąd pobierania QR kodu: ' + error.message);
    }
}

// Function to load gallery
async function loadGallery(){
    try{
        console.log('📷 Loading gallery...');
        const response = await fetch('/api/files');
        if (!response.ok) {
            console.error('❌ API response not OK:', response.status);
            return;
        }

        const files = await response.json();
        console.log('📁 Files received:', files.length);

        // Update stats first
        const photos = files.filter(f => f.type && f.type.startsWith('image')).length;
        const videos = files.filter(f => f.type && f.type.startsWith('video')).length;
        const totalSize = Math.round(files.reduce((sum,f) => sum + (f.size || 0), 0) / 1024 / 1024);

        console.log('📊 Stats:', {photos, videos, totalSize, total: files.length});

        document.getElementById('photos').textContent = photos;
        document.getElementById('videos').textContent = videos;
        document.getElementById('size').textContent = totalSize;
        document.getElementById('total').textContent = files.length;

        const gallery = document.getElementById('gallery');

        if(files.length === 0) {
            gallery.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666;">Brak przesłanych plików</div>';
            return;
        }

        var galleryHTML = '';
        for(var i = 0; i < files.length; i++) {
            try {
                var file = files[i];
                if (!file || !file.name) {
                    console.warn('⚠️ Invalid file object at index', i, file);
                    continue;
                }

                var fileName = String(file.name).toLowerCase();
                var fileType = String(file.type || '');
                var fileSize = file.size || 0;
                var sizeMB = Math.round(fileSize/1024/1024*10)/10;

                var isVideo = fileType.startsWith('video');
                var isHeic = fileName.includes('.heic') || fileName.includes('.heif') || fileType.includes('heic');

                var cleanFileName = file.name.replace(/['"]/g, '');

                if(isHeic) {
                    galleryHTML += '<div class="photo"><div style="width:100%;height:100px;background:linear-gradient(45deg,#ff6b6b,#feca57);display:flex;align-items:center;justify-content:center;color:white;font-size:1.2em;flex-direction:column;border-radius:8px;position:relative;"><div>📸</div><div style="font-size:0.4em;margin-top:2px;">HEIC</div><div style="position:absolute;bottom:2px;font-size:0.3em;">' + sizeMB + 'MB</div></div></div>';
                } else if(isVideo) {
                    galleryHTML += '<div class="photo" style="position:relative;"><video controls style="width:100%;height:100px;object-fit:cover;border-radius:8px;"><source src="/uploads/' + encodeURIComponent(cleanFileName) + '" type="' + fileType + '">Video not supported</video><div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.7);color:white;padding:2px 5px;font-size:0.7em;border-radius:3px;">🎬 ' + sizeMB + 'MB</div></div>';
                } else {
                    galleryHTML += '<div class="photo" style="position:relative;"><img src="/uploads/' + encodeURIComponent(cleanFileName) + '" style="width:100%;height:100px;object-fit:cover;border-radius:8px;"><div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.7);color:white;padding:2px 5px;font-size:0.7em;border-radius:3px;">📸 ' + sizeMB + 'MB</div></div>';
                }
            } catch(fileError) {
                console.error('❌ Error processing file at index', i, fileError);
            }
        }

        gallery.innerHTML = galleryHTML;
        console.log('✅ Gallery updated with', files.length, 'files');

    } catch(e) {
        console.error('❌ Gallery error:',e);
        document.getElementById('gallery').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#ff6b6b;">Błąd ładowania galerii: ' + e.message + '</div>';
    }
}

// Function to copy link to clipboard
function copyLink(){
    const url = document.getElementById('guest-url').textContent;
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ Skopiowano: ' + url);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('✅ Skopiowano: ' + url);
    });
}

// Initialize everything
console.log('🚀 Starting initial load...');

// Start with URL detection
detectPublicUrl().then(() => {
    console.log('✅ URL detection completed');
});

// Load gallery
loadGallery();

// Auto-refresh gallery every 10 seconds
setInterval(loadGallery, 10000);

console.log('✅ Admin panel JavaScript loaded successfully');
</script>
</body>
</html>`);
});

router.get('/upload', (req, res) => {
    res.send(`<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Upload</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📱</text></svg>">
<style>
body{font-family:Arial;padding:20px;background:linear-gradient(135deg,#ff9a9e,#fecfef);min-height:100vh}
.container{max-width:600px;margin:0 auto;background:white;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
.header{background:linear-gradient(45deg,#ff6b6b,#feca57);color:white;padding:30px;text-align:center;position:relative}
.back{position:absolute;top:15px;left:15px;background:rgba(255,255,255,0.2);padding:8px 15px;border-radius:20px;text-decoration:none;color:white}
.welcome{background:#e8f5e8;color:#2e7d32;padding:20px;margin:20px;border-radius:10px;text-align:center}
.upload-area{margin:30px;padding:50px 20px;border:3px dashed #ddd;border-radius:15px;text-align:center;background:#f8f9fa;cursor:pointer;transition:all 0.3s}
.upload-area:hover{border-color:#ff6b6b;background:#fff5f5}
.upload-area.dragover{border-color:#ff6b6b;background:#fff5f5;transform:scale(1.02)}
.upload-icon{font-size:4em;margin-bottom:20px}
.btn{background:linear-gradient(45deg,#ff6b6b,#feca57);color:white;padding:15px 30px;border:none;border-radius:25px;font-size:1.2em;cursor:pointer;margin:10px}
.file-input{display:none}
.progress{width:100%;height:25px;background:#e9ecef;border-radius:15px;overflow:hidden;margin:20px 0;display:none}
.progress-bar{height:100%;background:linear-gradient(45deg,#ff6b6b,#feca57);width:0%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;transition:width 0.3s}
.success{background:#d4edda;color:#155724;padding:20px;border-radius:15px;margin:20px;display:none;text-align:center}
.preview{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:15px;margin:20px}
.preview-item{border-radius:15px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.1);position:relative;background:#f8f9fa;min-height:120px}
.preview-item img,.preview-item video{width:100%;height:120px;object-fit:cover}
.preview-overlay{position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);color:white;padding:8px;font-size:0.8em;text-align:center}
.heic-placeholder{width:100%;height:120px;background:linear-gradient(45deg,#ff6b6b,#feca57);display:flex;align-items:center;justify-content:center;color:white;font-size:2em;flex-direction:column}
.tips{background:#fff3cd;padding:15px;border-radius:10px;margin:20px;font-size:0.9em}
.clear-btn{background:#dc3545;color:white;padding:10px 20px;border:none;border-radius:20px;margin:5px;cursor:pointer}
</style>
</head>
<body>
<div class="container">
<div class="header">
<a href="/" class="back">← Panel</a>
<h1>📸 ${config.EVENT_NAME}</h1>
<p>Prześlij wspomnienia!</p>
</div>

<div class="welcome">
<strong>🎉 Witamy!</strong><br>
Wybierz <strong>wiele plików naraz</strong> (Ctrl+klik lub przeciągnij grupę)<br>
<strong>HEIC z iPhone obsługiwany!</strong> ✅
</div>

<div class="upload-area" onclick="document.getElementById('fileInput').click()">
<div class="upload-icon">📱</div>
<div style="font-size:1.3em;margin-bottom:10px">Kliknij lub przeciągnij pliki</div>
<div style="color:#666;margin-bottom:20px">Możesz wybrać wiele naraz!</div>
<button class="btn" type="button">📁 Wybierz pliki</button>
<input type="file" id="fileInput" class="file-input" multiple accept="image/*,video/*,.heic,.heif,.HEIC,.HEIF">
</div>

<div class="tips">
💡 <strong>Multiple selection:</strong> Ctrl+klik (Windows) lub Cmd+klik (Mac)<br>
📱 <strong>HEIC iPhone:</strong> Podgląd może nie działać, ale upload TAK!<br>
📤 Max 10 plików, każdy do 200MB
</div>

<div class="progress" id="progress">
<div class="progress-bar" id="progressBar">0%</div>
</div>

<div class="success" id="success">
✅ <strong>Sukces!</strong> Pliki przesłane!<br>
<small>Zniknie za 15 sekund</small><br>
<button class="clear-btn" onclick="clearAll()">🧹 Wyczyść i prześlij więcej</button>
</div>

<div class="preview" id="preview"></div>

<div style="text-align:center;margin:20px;display:none" id="controls">
<button class="clear-btn" onclick="clearAll()">🧹 Wyczyść</button>
<button class="btn" onclick="location.reload()">🔄 Odśwież</button>
</div>
</div>

<script>
console.log('🚀 Upload page JavaScript starting...');

var fileInput = document.getElementById('fileInput');
var uploadArea = document.querySelector('.upload-area');
var progress = document.getElementById('progress');
var progressBar = document.getElementById('progressBar');
var success = document.getElementById('success');
var preview = document.getElementById('preview');

console.log('✅ Elements found:', {
    fileInput: !!fileInput,
    uploadArea: !!uploadArea,
    progress: !!progress,
    progressBar: !!progressBar,
    success: !!success,
    preview: !!preview
});

// Drag & Drop events
var dragEvents = ['dragenter','dragover','dragleave','drop'];
for(var i = 0; i < dragEvents.length; i++) {
    uploadArea.addEventListener(dragEvents[i], function(e) {
        e.preventDefault();
    });
}

uploadArea.addEventListener('dragover', function() {
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', function() {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', function(e) {
    uploadArea.classList.remove('dragover');
    var files = Array.prototype.slice.call(e.dataTransfer.files);
    console.log('📁 Files dropped:', files.length);
    handleFiles(files);
});

fileInput.addEventListener('change', function(e) {
    var files = Array.prototype.slice.call(e.target.files);
    console.log('📁 Files selected:', files.length);
    handleFiles(files);
});

function handleFiles(files) {
    console.log('📄 Processing files:', files.length);
    
    if(!files.length) {
        console.log('❌ No files to process');
        return;
    }

    var validFiles = [];
    
    for(var i = 0; i < files.length; i++) {
        var file = files[i];
        var fileName = file.name.toLowerCase();
        var isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
        var isImg = file.type.startsWith('image/') || isHeic;
        var isVid = file.type.startsWith('video/');
        
        console.log('📄 File check:', file.name, 'Type:', file.type, 'Image:', isImg, 'HEIC:', isHeic);

        if(!isImg && !isVid) {
            alert('❌ ' + file.name + ' - nieobsługiwany format');
            continue;
        }
        
        if(file.size > 200 * 1024 * 1024) {
            alert('❌ ' + file.name + ' - za duży (max 200MB)');
            continue;
        }
        
        validFiles.push(file);
    }
    
    if(validFiles.length > 10) {
        validFiles = validFiles.slice(0, 10);
        alert('⚠️ Wybrano tylko pierwsze 10 plików');
    }

    if(validFiles.length) {
        console.log('✅ Valid files:', validFiles.length);
        showPreview(validFiles);
        uploadFiles(validFiles);
    }
}

function showPreview(files) {
    console.log('🖼️ Showing preview for', files.length, 'files');
    preview.innerHTML = '';
    
    for(var i = 0; i < files.length; i++) {
        var file = file