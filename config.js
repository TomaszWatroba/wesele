const path = require('path');

module.exports = {
    // Wedding Details
    EVENT_NAME: 'Gosia & Tomek 2025',
    COUPLE_NAMES: {
        bride: 'Gosia',
        groom: 'Tomek'
    },
    WEDDING_DATE: '2025-08-15', // Update with actual date
    VENUE: 'Beautiful Wedding Venue', // Update with actual venue
    
    // Server Configuration
    PORT: process.env.PORT || 3000,
    DOMAIN: process.env.WEDDING_DOMAIN || 'gosiaitomek.pl',
    
    // Admin Security
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'wedding2025!', // CHANGE THIS!
    ADMIN_SESSION_SECRET: process.env.ADMIN_SECRET || 'your-secret-key-here',
    
    // File Configuration
    UPLOADS_DIR: path.join(__dirname, 'wedding-photos'),
    LOG_FILE: path.join(__dirname, 'wedding-log.txt'),
    MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
    MAX_FILES_PER_UPLOAD: 10,
    
    // Rate Limiting
    RATE_LIMIT: {
        WINDOW_MS: 5 * 60 * 1000, // 5 minutes
        MAX_UPLOADS: 20
    },
    
    // File Types
    ALLOWED_EXTENSIONS: [
        '.jpg', '.jpeg', '.png', '.gif', '.webp', 
        '.heic', '.heif', '.heics', '.heifs', '.avif',
        '.mp4', '.mov', '.avi', '.mkv', '.webm', 
        '.3gp', '.3g2', '.m4v'
    ],
    
    // QR Code Settings
    QR_OPTIONS: {
        width: 400,
        margin: 3,
        color: {
            dark: '#333333',
            light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
    },
    
    // Website Content Configuration
    MENU_ITEMS: [
        { 
            name: 'Przystawki',
            items: [
                'Tatar z łososia z awokado',
                'Bruschetta z pomidorami',
                'Sery regionalne z miodem'
            ]
        },
        {
            name: 'Dania główne',
            items: [
                'Filet z dorsza w ziołach',
                'Polędwica wołowa z grilla',
                'Risotto z grzybami leśnymi (wegetariańskie)'
            ]
        }
    ],
    
    DRINKS: [
        { category: 'Koktajle firmowe', items: ['Gosia & Tomek Spritz', 'Sunset Love'] },
        { category: 'Wina', items: ['Białe półwytrawne', 'Czerwone wytrawne'] },
        { category: 'Napoje bezalkoholowe', items: ['Woda gazowana/niegazowana', 'Soki świeże'] }
    ],
    
    // Helper function for base URL
    getBaseURL: function(req) {
        const host = req.get('host') || 'localhost:3000';
        const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        
        if (host.includes('gosiaitomek.pl') || host.includes('trycloudflare.com')) {
            return `https://${host}`;
        }
        
        return `${protocol}://${host}`;
    }
};