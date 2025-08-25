// config.js - Complete configuration with admin password
const path = require('path');

module.exports = {
    // Podstawowe ustawienia
    PORT: process.env.PORT || 3000,
    EVENT_NAME: 'Nasze Wesele 2025', // ZMIEŃ NA SWOJĄ NAZWĘ
    
    // *** ADMIN PASSWORD - CHANGE THIS IMMEDIATELY! ***
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'wedding2025!', // CHANGE THIS!
    
    // Para młoda
    COUPLE_NAMES: {
        bride: "Gosia",
        groom: "Tomek"
    },
    
    // Wedding details
    WEDDING_DATE: '2025-10-10', // Format: YYYY-MM-DD
    VENUE: 'Sala Weselna "Biały Dom" Paniówki',
    DOMAIN: 'gosiaitomek.pl',
    
    // Dynamic URL configuration
    PUBLIC_URL: process.env.PUBLIC_URL || null, // Will be set dynamically
    CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN || 'gosiaitomek.pl', // Your custom domain
    
    // Ścieżki
    UPLOADS_DIR: path.join(__dirname, 'wedding-photos'),
    LOG_FILE: path.join(__dirname, 'wedding-log.txt'),
    
    // Limity plików
    MAX_FILE_SIZE: 200 * 1024 * 1024, // 200MB
    MAX_FILES_PER_UPLOAD: 10,
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 5 * 60 * 1000, // 5 minut
        MAX_UPLOADS: 20 // 20 przesyłań na okno czasowe
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
    
    // Menu configuration
    MENU: [
        {
            category: "Przystawki",
            items: [
                "Carpaccio z łososia z kaparami",
                "Bruschetta z pomidorami i bazylią",
                "Tartar z tuńczyka"
            ]
        },
        {
            category: "Zupy",
            items: [
                "Żurek na żeberkach",
                "Krem z dyni z grzankami"
            ]
        },
        {
            category: "Dania główne",
            items: [
                "Stek wołowy z ziemniakami grillowanymi",
                "Łosoś z warzywami sezonowymi",
                "Pierś z kaczki z sosem wiśniowym"
            ]
        },
        {
            category: "Desery",
            items: [
                "Tort weselny",
                "Tiramisu",
                "Sorbet owocowy"
            ]
        }
    ],
    
    // Drinks configuration
    DRINKS: [
        {
            category: "Wina białe",
            items: [
                "Chardonnay",
                "Sauvignon Blanc",
                "Riesling"
            ]
        },
        {
            category: "Wina czerwone", 
            items: [
                "Cabernet Sauvignon",
                "Merlot",
                "Pinot Noir"
            ]
        },
        {
            category: "Alkohole",
            items: [
                "Whiskey",
                "Vodka",
                "Rum",
                "Gin"
            ]
        },
        {
            category: "Napoje bezalkoholowe",
            items: [
                "Woda mineralna",
                "Soki owocowe",
                "Coca-Cola",
                "Sprite",
                "Kawa",
                "Herbata"
            ]
        }
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
    },
    
    // Timeout dla upload (5 minut)
    UPLOAD_TIMEOUT: 5 * 60 * 1000,
    
    // Function to get the correct base URL
    getBaseURL: function(req) {
        // If PUBLIC_URL is set via environment variable, use it
        if (this.PUBLIC_URL) {
            return this.PUBLIC_URL;
        }
        
        // Check for tunnel indicators
        const host = req.get('Host');
        const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        
        // Detect if running through tunnel (Cloudflare, ngrok, etc.)
        if (host && (host.includes('cloudflare') || host.includes('trycloudflare.com') || host.includes('.ngrok.io'))) {
            return `https://${host}`;
        }
        
        // Use custom domain if configured
        if (this.CUSTOM_DOMAIN && this.CUSTOM_DOMAIN !== 'localhost') {
            return `https://${this.CUSTOM_DOMAIN}`;
        }
        
        // Fallback to request host
        return `${protocol}://${host}`;
    }
};