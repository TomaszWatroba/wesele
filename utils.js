// utils.js - Funkcje pomocnicze
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 📋 Funkcja logowania
const logActivity = (action, details = '') => {
    const timestamp = new Date().toLocaleString('pl-PL');
    const logEntry = `[${timestamp}] ${action} - ${details}\n`;
    
    try {
        fs.appendFileSync(config.LOG_FILE, logEntry);
        console.log(`📝 ${action} - ${details}`);
    } catch (error) {
        console.error('Błąd zapisu logu:', error);
    }
};

// 📁 Inicjalizacja folderów
const initializeDirectories = () => {
    if (!fs.existsSync(config.UPLOADS_DIR)) {
        fs.mkdirSync(config.UPLOADS_DIR, { recursive: true });
        logActivity('DIRECTORY_CREATED', `Created uploads directory: ${config.UPLOADS_DIR}`);
    }
};

// 🔍 Sprawdzanie typu pliku - obsługa WSZYSTKICH formatów mobilnych
const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase(); // Zawsze małe litery!
    
    // Wszystkie formaty zdjęć
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', 
                       '.heics', '.heifs', '.avif', '.jfif', '.pjpeg', '.tiff', '.tif', '.bmp'];
    
    // Wszystkie formaty filmów                   
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2', 
                       '.m4v', '.wmv', '.flv', '.ogv', '.quicktime'];
    
    if (imageExts.includes(ext)) {
        return 'image/' + ext.substring(1);
    } else if (videoExts.includes(ext)) {
        return 'video/' + ext.substring(1);
    }
    
    return 'unknown';
};

// 📊 Generowanie statystyk z plików
const generateFileStats = (files) => {
    const photos = files.filter(f => f.type.startsWith('image')).length;
    const videos = files.filter(f => f.type.startsWith('video')).length;
    const totalSize = Math.round(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024);
    
    return {
        photos,
        videos,
        totalSize,
        totalFiles: files.length
    };
};

// 📊 Analiza logów
const analyzeActivityLogs = () => {
    try {
        if (!fs.existsSync(config.LOG_FILE)) {
            return { uploads: 0, totalActivities: 0 };
        }
        
        const logs = fs.readFileSync(config.LOG_FILE, 'utf8');
        const logLines = logs.split('\n').filter(line => line.trim());
        const uploads = logLines.filter(line => line.includes('UPLOAD_SUCCESS')).length;
        
        return {
            uploads,
            totalActivities: logLines.length,
            recentLogs: logLines.slice(-20).reverse()
        };
    } catch (error) {
        console.error('Błąd analizy logów:', error);
        return { uploads: 0, totalActivities: 0, recentLogs: [] };
    }
};

// 🔧 Bezpieczna nazwa pliku
const generateSafeFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${timestamp}_${randomString}_${safeOriginalName}`;
};

// 📂 Odczyt listy plików z uploadsDir
const getUploadedFiles = () => {
    try {
        return fs.readdirSync(config.UPLOADS_DIR).map(filename => {
            const filepath = path.join(config.UPLOADS_DIR, filename);
            const stats = fs.statSync(filepath);
            
            return {
                name: filename,
                size: stats.size,
                created: stats.birthtime,
                type: getFileType(filename)
            };
        }).sort((a, b) => b.created - a.created); // Najnowsze na górze
    } catch (error) {
        console.error('Błąd odczytu plików:', error);
        return [];
    }
};

// 🧹 Funkcja sprzątania (opcjonalnie, do uruchomienia ręcznego)
const cleanupOldFiles = (daysOld = 30) => {
    try {
        const files = fs.readdirSync(config.UPLOADS_DIR);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let deletedCount = 0;
        
        files.forEach(filename => {
            const filepath = path.join(config.UPLOADS_DIR, filename);
            const stats = fs.statSync(filepath);
            
            if (stats.birthtime < cutoffDate) {
                fs.unlinkSync(filepath);
                deletedCount++;
            }
        });
        
        if (deletedCount > 0) {
            logActivity('CLEANUP', `Deleted ${deletedCount} files older than ${daysOld} days`);
        }
        
        return deletedCount;
    } catch (error) {
        console.error('Błąd czyszczenia:', error);
        return 0;
    }
};

module.exports = {
    logActivity,
    initializeDirectories,
    getFileType,
    generateFileStats,
    analyzeActivityLogs,
    generateSafeFilename,
    getUploadedFiles,
    cleanupOldFiles
};