// config/upload-config.js - File Upload Configuration
module.exports = {
    // File limits
    MAX_FILE_SIZE: 4000 * 1024 * 1024, // 4GB
    MAX_FILES_PER_UPLOAD: 20,
    UPLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 5 * 60 * 1000, // 5 minutes
        MAX_UPLOADS: 20 // 20 uploads per window
    },
    
    // Allowed file types - ALL mobile formats
    ALLOWED_FILE_TYPES: [
        // Photos - standard
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // Photos - iPhone/mobile
        'image/heic', 'image/heif', 'image/heics', 'image/heifs',
        // Photos - other mobile formats
        'image/avif', 'image/jfif', 'image/pjpeg', 'image/svg+xml',
        // Photos - raw formats (some phones)
        'image/tiff', 'image/bmp', 'image/x-icon',
        // Videos - standard
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        // Videos - mobile
        'video/mov', 'video/3gpp', 'video/3gpp2', 'video/x-flv',
        // Videos - other popular
        'video/avi', 'video/mkv', 'video/webm', 'video/ogg', 'video/wmv'
    ],
    
    // File extensions - all mobile
    ALLOWED_EXTENSIONS: [
        // Photos
        '.jpg', '.jpeg', '.png', '.gif', '.webp', 
        '.heic', '.heif', '.heics', '.heifs', '.avif',
        '.jfif', '.pjpeg', '.tiff', '.tif', '.bmp',
        // Videos  
        '.mp4', '.mov', '.avi', '.mkv', '.webm', 
        '.3gp', '.3g2', '.m4v', '.wmv', '.flv', '.ogv'
    ],
    
    // Dangerous extensions to block
    BANNED_EXTENSIONS: [
        '.exe', '.bat', '.cmd', '.scr', '.com', '.pif', '.jar', 
        '.php', '.asp', '.jsp', '.ps1', '.vbs', '.js', '.sh'
    ]
};