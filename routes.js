// routes.js - UPROSZCZONE trasy BEZ długich template stringów
const express = require('express');
const config = require('./config');
const { analyzeActivityLogs } = require('./utils');

const router = express.Router();

// Strona główna - panel organizatora
router.get('/', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Organizatora</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 30px; border-radius: 15px; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .btn { background: #007bff; color: white; padding: 15px 25px; border: none; border-radius: 25px; margin: 10px; text-decoration: none; display: inline-block; transition: all 0.3s ease; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.2); }
        .btn.green { background: #28a745; }
        .btn.orange { background: #fd7e14; }
        .btn.purple { background: #6f42c1; }
        .section { background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 20px 0; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: linear-gradient(45deg, #48cae4, #023e8a); color: white; padding: 25px; border-radius: 15px; text-align: center; }
        .stat-number { font-size: 2.5em; font-weight: bold; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .photo-item { border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); background: white; }
        .photo-item img, .photo-item video { width: 100%; height: 150px; object-fit: cover; }
        .photo-info { padding: 10px; font-size: 0.9em; color: #666; }
        .url-box { background: #e9ecef; padding: 15px; border-radius: 10px; margin: 15px 0; font-family: monospace; word-break: break-all; }
        .info-box { background: #e8f5e8; border-left: 4px solid #4caf50; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📸 ${config.EVENT_NAME}</h1>
            <p>Panel Organizatora - Zarządzaj swoją galerią!</p>
        </div>
        
        <div class="info-box">
            <h3>✨ Jak to działa:</h3>
            <p>• Goście wchodzą na link → przesyłają zdjęcia i filmy</p>
            <p>• Żadnych haseł - po prostu działa!</p>
            <p>• Pliki <strong>NIGDY nie będą usunięte</strong></p>
        </div>

        <div class="section">
            <h2>🎯 Zarządzanie</h2>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 10px; margin: 15px 0;">
                <h3>📱 Link dla gości:</h3>
                <div class="url-box" id="guest-url">http://localhost:${config.PORT}/upload</div>
                <button class="btn" onclick="copyLink()">📋 Kopiuj link</button>
                <a href="/upload" class="btn green">📱 Idź do strony gości</a>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <h3>🎯 QR Kod:</h3>
                <div id="qr-container"></div>
                <button class="btn orange" onclick="generateQR()">🔄 Wygeneruj QR kod</button>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <h3>📥 Eksport:</h3>
                <button class="btn purple" onclick="downloadAll()">📥 Pobierz wszystkie (ZIP)</button>
                <a href="/logs" class="btn">📊 Statystyki</a>
            </div>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="photo-count">0</div>
                <div>Zdjęć</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="video-count">0</div>
                <div>Filmów</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-size">0 MB</div>
                <div>Rozmiar</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-files">0</div>
                <div>Razem plików</div>
            </div>
        </div>

        <h2>📷 Galeria na żywo</h2>
        <div class="gallery" id="gallery"></div>
    </div>

    <script>
        async function generateQR() {
            const url = document.getElementById('guest-url').textContent;
            try {
                const response = await fetch('/api/qr?url=' + encodeURIComponent(url));
                const qrDataUrl = await response.text();
                document.getElementById('qr-container').innerHTML = 
                    '<div style="margin: 20px 0;"><img src="' + qrDataUrl + '" style="max-width: 300px; border: 3px solid white; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);"></div>';
            } catch (error) {
                console.error('Błąd QR:', error);
            }
        }

        async function loadGallery() {
            try {
                const response = await fetch('/api/files');
                const files = await response.json();
                
                const photos = files.filter(f => f.type.startsWith('image')).length;
                const videos = files.filter(f => f.type.startsWith('video')).length;
                const totalSize = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024);

                document.getElementById('photo-count').textContent = photos;
                document.getElementById('video-count').textContent = videos;
                document.getElementById('total-size').textContent = totalSize + ' MB';
                document.getElementById('total-files').textContent = files.length;

                const gallery = document.getElementById('gallery');
                if (files.length === 0) {
                    gallery.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: #666;"><h3>🔍 Brak zdjęć</h3><p>Gdy goście zaczną przesyłać, pojawią się tutaj automatycznie!</p></div>';
                } else {
                    gallery.innerHTML = files.map(file => {
                        const isVideo = file.type.startsWith('video');
                        const mediaElement = isVideo 
                            ? '<video src="/uploads/' + file.name + '" controls preload="metadata"></video>'
                            : '<img src="/uploads/' + file.name + '" alt="Zdjęcie" loading="lazy">';
                        
                        return '<div class="photo-item">' +
                            mediaElement +
                            '<div class="photo-info">' +
                                '<div>📅 ' + new Date(file.created).toLocaleString('pl-PL') + '</div>' +
                                '<div>📁 ' + Math.round(file.size / 1024) + ' KB</div>' +
                            '</div>' +
                        '</div>';
                    }).join('');
                }
            } catch (error) {
                console.error('Błąd ładowania:', error);
            }
        }

        function copyLink() {
            const url = document.getElementById('guest-url').textContent;
            navigator.clipboard.writeText(url).then(() => {
                const btn = event.target;
                const originalText = btn.textContent;
                btn.textContent = '✅ Skopiowano!';
                btn.style.background = '#28a745';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '#007bff';
                }, 2000);
            }).catch(() => {
                alert('✅ Link skopiowany!');
            });
        }

        function downloadAll() {
            window.location.href = '/api/download-all';
        }

        document.addEventListener('DOMContentLoaded', function() {
            generateQR();
            loadGallery();
            setInterval(loadGallery, 10000);
        });
    </script>
</body>
</html>`);
});

// Strona upload dla gości
router.get('/upload', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prześlij zdjęcia</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); min-height: 100vh; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 2.2em; margin-bottom: 10px; }
        .welcome { background: #e8f5e8; color: #2e7d32; padding: 20px; margin: 20px; border-radius: 10px; text-align: center; }
        .upload-area { margin: 30px; padding: 50px 20px; border: 3px dashed #ddd; border-radius: 15px; text-align: center; background: #f8f9fa; cursor: pointer; transition: all 0.3s ease; }
        .upload-area:hover { border-color: #ff6b6b; background: #fff5f5; }
        .upload-area.dragover { border-color: #ff6b6b; background: #fff5f5; transform: scale(1.02); box-shadow: 0 0 20px rgba(255, 107, 107, 0.3); }
        .upload-icon { font-size: 4em; margin-bottom: 20px; }
        .upload-text { font-size: 1.3em; color: #333; margin-bottom: 10px; font-weight: 500; }
        .upload-subtext { color: #666; margin-bottom: 20px; font-size: 0.95em; }
        .file-input { display: none; }
        .btn { background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 15px 30px; border: none; border-radius: 25px; font-size: 1.2em; cursor: pointer; margin: 10px; }
        .btn:hover { transform: translateY(-2px); }
        .progress { width: 100%; height: 25px; background: #e9ecef; border-radius: 15px; overflow: hidden; margin: 20px 0; display: none; }
        .progress-bar { height: 100%; background: linear-gradient(45deg, #ff6b6b, #feca57); width: 0%; transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
        .success { background: #d4edda; color: #155724; padding: 20px; border-radius: 15px; margin: 20px; display: none; text-align: center; }
        .file-preview { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px; margin: 20px; }
        .preview-item { border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); position: relative; }
        .preview-item img, .preview-item video { width: 100%; height: 120px; object-fit: cover; }
        .preview-overlay { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); color: white; padding: 5px; font-size: 0.8em; text-align: center; }
        .tips { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 10px; margin: 20px; font-size: 0.9em; }
        .back-link { position: absolute; top: 20px; left: 20px; background: rgba(255,255,255,0.2); color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="position: relative;">
            <a href="/" class="back-link">← Panel</a>
            <h1>📸 ${config.EVENT_NAME}</h1>
            <p>Podziel się wspomnieniami!</p>
        </div>
        
        <div class="welcome">
            <strong>🎉 Witamy!</strong><br>
            Możesz wybrać <strong>wiele zdjęć i filmów naraz</strong> - będą bezpiecznie zapisane.
        </div>
        
        <div class="upload-area" onclick="triggerFileSelect()">
            <div class="upload-icon">📱</div>
            <div class="upload-text">Kliknij lub przeciągnij pliki</div>
            <div class="upload-subtext">Możesz wybrać wiele plików naraz!</div>
            <button class="btn" type="button">📁 Wybierz wiele plików</button>
            <input type="file" id="fileInput" class="file-input" multiple accept="image/*,video/*,.heic,.heif">
        </div>

        <div class="tips">
            💡 <strong>Obsługiwane formaty:</strong><br>
            📸 <strong>Zdjęcia:</strong> JPG, PNG, GIF, WEBP, <strong>HEIC (iPhone)</strong>, HEIF, AVIF, TIFF<br>
            🎬 <strong>Filmy:</strong> MP4, MOV, AVI, MKV, WEBM, 3GP (Android), M4V<br>
            • <strong>Wybierz wiele plików:</strong> Ctrl+klik (Windows) lub Cmd+klik (Mac)<br>
            • Lub przeciągnij całą grupę plików naraz!<br>
            • Maksymalnie 10 plików naraz, każdy do 200MB
        </div>

        <div class="progress" id="progress">
            <div class="progress-bar" id="progressBar">0%</div>
        </div>

        <div class="success" id="success">
            ✅ <strong>Dziękujemy!</strong><br>
            Pliki zostały przesłane pomyślnie!<br>
            Możesz przesłać więcej lub wrócić do panelu.
        </div>

        <div class="file-preview" id="preview"></div>
    </div>

    <script>
        function triggerFileSelect() {
            document.getElementById('fileInput').click();
        }

        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.querySelector('.upload-area');
        const progress = document.getElementById('progress');
        const progressBar = document.getElementById('progressBar');
        const success = document.getElementById('success');
        const preview = document.getElementById('preview');

        // Drag & Drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, (e) => e.preventDefault(), false);
        });

        uploadArea.addEventListener('dragover', () => uploadArea.classList.add('dragover'));
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            uploadArea.classList.remove('dragover');
            handleFiles(Array.from(e.dataTransfer.files));
        });

        fileInput.addEventListener('change', (e) => {
            console.log('Wybrano plików:', e.target.files.length);
            handleFiles(Array.from(e.target.files));
        });

       function handleFiles(files) {
    if (files.length === 0) return;
    
    console.log('Przetwarzanie', files.length, 'plików');
    
    const validFiles = files.filter(file => {
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        
        // Sprawdź typ MIME
        const isImage = fileType.startsWith('image/');
        const isVideo = fileType.startsWith('video/');
        
        // Sprawdź rozszerzenie dla plików HEIC/HEIF (iPhone)
        const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || 
                      fileName.endsWith('.heics') || fileName.endsWith('.heifs');
        
        // Sprawdź inne popularne rozszerzenia zdjęć
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.bmp', '.avif'];
        const hasImageExt = imageExtensions.some(ext => fileName.endsWith(ext));
        
        // Sprawdź rozszerzenia filmów
        const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.m4v', '.wmv'];
        const hasVideoExt = videoExtensions.some(ext => fileName.endsWith(ext));
        
        // Akceptuj jeśli to obraz, video, lub ma odpowiednie rozszerzenie
        const isValidFile = isImage || isVideo || isHeic || hasImageExt || hasVideoExt;
        
        if (!isValidFile) {
            console.log('❌ Odrzucono:', file.name, 'typ:', fileType);
            alert('Plik ' + file.name + ' nie jest obsługiwanym formatem.');
            return false;
        }
        
        if (file.size > 200 * 1024 * 1024) {
            alert('Plik ' + file.name + ' jest za duży (max 200MB).');
            return false;
        }
        
        // Log dla plików iPhone
        if (isHeic) {
            console.log('✅ Plik iPhone HEIC/HEIF wykryty:', file.name, 'rozmiar:', Math.round(file.size/1024/1024) + 'MB');
        }
        
        console.log('✅ Zaakceptowano:', file.name, 'typ:', fileType || 'unknown');
        return true;
    });

    console.log('Prawidłowe pliki:', validFiles.length, 'z', files.length);

    if (validFiles.length > 0) {
        showPreview(validFiles);
        uploadFiles(validFiles);
    } else {
        alert('❌ Nie znaleziono prawidłowych plików do przesłania.');
    }
}

       function showPreview(files) {
    preview.innerHTML = '';
    files.forEach(file => {
        const div = document.createElement('div');
        div.className = 'preview-item';
        
        const fileName = file.name.toLowerCase();
        const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif');
        const isImage = file.type.startsWith('image/') || isHeic;
        const isVideo = file.type.startsWith('video/') && !isHeic;
        
        if (isImage || isHeic) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            div.appendChild(img);
            
            const overlay = document.createElement('div');
            overlay.className = 'preview-overlay';
            overlay.textContent = isHeic ? '📸 HEIC iPhone' : '📸 Zdjęcie';
            div.appendChild(overlay);
        } else if (isVideo) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.muted = true;
            div.appendChild(video);
            
            const overlay = document.createElement('div');
            overlay.className = 'preview-overlay';
            overlay.textContent = '🎬 Film';
            div.appendChild(overlay);
        }
        
        preview.appendChild(div);
    });
}

        async function uploadFiles(files) {
            const formData = new FormData();
            files.forEach(file => formData.append('files', file));

            progress.style.display = 'block';
            success.style.display = 'none';

            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    progressBar.style.width = percent + '%';
                    progressBar.textContent = percent + '%';
                }
            });

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    success.style.display = 'block';
                    progress.style.display = 'none';
                    setTimeout(() => {
                        preview.innerHTML = '';
                        fileInput.value = '';
                        success.style.display = 'none';
                    }, 5000);
                } else {
                    alert('Błąd przesyłania');
                    progress.style.display = 'none';
                }
            });

            xhr.open('POST', '/api/upload', true);
            xhr.send(formData);
        }
    </script>
</body>
</html>`);
});

// Panel główny
router.get('/panel', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Panel</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 20px; }
        .header { text-align: center; margin-bottom: 30px; background: linear-gradient(45deg, #ff6b6b, #feca57); color: white; padding: 30px; border-radius: 15px; }
        .btn { background: #007bff; color: white; padding: 15px 25px; border: none; border-radius: 25px; margin: 10px; text-decoration: none; display: inline-block; }
        .btn.green { background: #28a745; }
        .section { background: #f8f9fa; padding: 25px; border-radius: 15px; margin: 20px 0; text-align: center; }
        .url-box { background: #e9ecef; padding: 15px; border-radius: 10px; margin: 15px 0; font-family: monospace; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: linear-gradient(45deg, #48cae4, #023e8a); color: white; padding: 25px; border-radius: 15px; text-align: center; }
        .stat-number { font-size: 2.5em; font-weight: bold; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px; }
        .photo-item { border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .photo-item img, .photo-item video { width: 100%; height: 150px; object-fit: cover; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📸 ${config.EVENT_NAME}</h1>
            <p>Panel Organizatora</p>
        </div>
        
        <div class="section">
            <h2>🎯 Zarządzanie</h2>
            <div class="url-box" id="guest-url">http://localhost:${config.PORT}/upload</div>
            <button class="btn" onclick="copyLink()">📋 Kopiuj link</button>
            <a href="/upload" class="btn green">📱 Strona gości</a>
            <div id="qr-container"></div>
            <button class="btn" onclick="generateQR()">🔄 QR kod</button>
            <button class="btn" onclick="downloadAll()">📥 Pobierz ZIP</button>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="photo-count">0</div>
                <div>Zdjęć</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="video-count">0</div>
                <div>Filmów</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="total-size">0 MB</div>
                <div>Rozmiar</div>
            </div>
        </div>

        <h2>📷 Galeria</h2>
        <div class="gallery" id="gallery"></div>
    </div>

    <script>
        async function generateQR() {
            const url = document.getElementById('guest-url').textContent;
            const response = await fetch('/api/qr?url=' + encodeURIComponent(url));
            const qrDataUrl = await response.text();
            document.getElementById('qr-container').innerHTML = '<img src="' + qrDataUrl + '" style="max-width: 300px; margin: 20px 0;">';
        }

        async function loadGallery() {
            const response = await fetch('/api/files');
            const files = await response.json();
            
            document.getElementById('photo-count').textContent = files.filter(f => f.type.startsWith('image')).length;
            document.getElementById('video-count').textContent = files.filter(f => f.type.startsWith('video')).length;
            document.getElementById('total-size').textContent = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024) + ' MB';

            const gallery = document.getElementById('gallery');
            gallery.innerHTML = files.map(file => {
                const isVideo = file.type.startsWith('video');
                const element = isVideo 
                    ? '<video src="/photos/' + file.name + '" controls></video>'
                    : '<img src="/photos/' + file.name + '">';
                return '<div class="photo-item">' + element + '</div>';
            }).join('');
        }

        function copyLink() {
            navigator.clipboard.writeText(document.getElementById('guest-url').textContent);
            alert('✅ Link skopiowany!');
        }

        function downloadAll() {
            window.location.href = '/api/download-all';
        }

        generateQR();
        loadGallery();
        setInterval(loadGallery, 10000);
    </script>
</body>
</html>`);
});

// Statystyki
router.get('/logs', (req, res) => {
    const logStats = analyzeActivityLogs();
    res.send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Statystyki</title>
<style>body{font-family:Arial;padding:20px;background:#f0f0f0}.container{max-width:800px;margin:0 auto;background:white;padding:30px;border-radius:20px}</style>
</head><body>
<div class="container">
<h1>📊 Statystyki</h1>
<a href="/">← Powrót</a>
<p>Przesłań: ${logStats.uploads}</p>
<p>Aktywności: ${logStats.totalActivities}</p>
</div></body></html>`);
});

module.exports = router;