// config.js - Centralna konfiguracja aplikacji
const path = require('path');

module.exports = {
    // Podstawowe ustawienia
    PORT: 3000,
    EVENT_NAME: 'Nasze Wesele 2024', // ZMIEŃ NA SWOJĄ NAZWĘ
    
    // Ścieżki
    UPLOADS_DIR: path.join(__dirname, 'wedding-photos'),
    LOG_FILE: path.join(__dirname, 'wedding-log.txt'),
    
    // Limity plików
    MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
    MAX_FILES_PER_UPLOAD: 10,
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 5 * 60 * 1000, // 5 minut
        MAX_UPLOADS: 20 // 20 przesłań na okno czasowe
    },
    
    // Dozwolone typy plików - WSZYSTKIE formaty mobilne
    ALLOWED_FILE_TYPES: [
        // Zdjęcia - standardowe
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Zdjęcia - iPhone/mobilne
        'image/heic', 'image/heif', 'image/heics', 'image/heifs',
        // Zdjęcia - inne mobilne formaty
        'image/avif', 'image/jfif', 'image/pjpeg', 'image/svg+xml',
        // Zdjęcia - raw formaty (niektóre telefony)
        'image/tiff', 'image/bmp', 'image/x-icon',
        // Filmy - standardowe
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        // Filmy - mobilne
        'video/mov', 'video/3gpp', 'video/3gpp2', 'video/x-flv',
        // Filmy - inne popularne
        'video/avi', 'video/mkv', 'video/webm', 'video/ogg', 'video/wmv'
    ],
    
    // Rozszerzenia plików - wszystkie mobilne
    ALLOWED_EXTENSIONS: [
        // Zdjęcia
        '.jpg', '.jpeg', '.png', '.gif', '.webp', 
        '.heic', '.heif', '.heics', '.heifs', '.avif',
        '.jfif', '.pjpeg', '.tiff', '.tif', '.bmp',
        // Filmy  
        '.mp4', '.mov', '.avi', '.mkv', '.webm', 
        '.3gp', '.3g2', '.m4v', '.wmv', '.flv', '.ogv'
    ],
    
    // QR Code settings
    QR_OPTIONS: {
        width: 400,
        margin: 3,
        color: {
            dark: '#333333',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
    }
};