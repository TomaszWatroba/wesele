// config.js - Complete configuration with admin password
const path = require('path');
require('dotenv').config();

module.exports = {
    // Podstawowe ustawienia
    PORT: process.env.PORT || 3000,
    EVENT_NAME: 'Nasze Wesele 2025', // ZMIEÅƒ NA SWOJÄ„ NAZWÄ˜
    
    // *** ADMIN PASSWORD - CHANGE THIS IMMEDIATELY! ***
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'wedding2025!', // CHANGE THIS!
    
    // Para mÅ‚oda
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
    
    // ÅšcieÅ¼ki
    UPLOADS_DIR: path.join(__dirname, 'wedding-photos'),
    LOG_FILE: path.join(__dirname, 'wedding-log.txt'),
    
    // Limity plikÃ³w - INCREASED FOR LONGER VIDEOS
MAX_FILE_SIZE: 4000 * 1024 * 1024, // 4GB (increased from 2GB)
UPLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes // 4GB (increased from 2GB) // 4GB (increased from 2GB)
    MAX_FILES_PER_UPLOAD: 20,
    
    // Rate limiting
    RATE_LIMIT: {
        WINDOW_MS: 5 * 60 * 1000, // 5 minut
        MAX_UPLOADS: 20 // 20 przesyÅ‚aÅ„ na okno czasowe
    },
    
    // Dozwolone typy plikÃ³w - WSZYSTKIE formaty mobilne
    ALLOWED_FILE_TYPES: [
        // ZdjÄ™cia - standardowe
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        // ZdjÄ™cia - iPhone/mobilne
        'image/heic', 'image/heif', 'image/heics', 'image/heifs',
        // ZdjÄ™cia - inne mobilne formaty
        'image/avif', 'image/jfif', 'image/pjpeg', 'image/svg+xml',
        // ZdjÄ™cia - raw formaty (niektÃ³re telefony)
        'image/tiff', 'image/bmp', 'image/x-icon',
        // Filmy - standardowe
        'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
        // Filmy - mobilne
        'video/mov', 'video/3gpp', 'video/3gpp2', 'video/x-flv',
        // Filmy - inne popularne
        'video/avi', 'video/mkv', 'video/webm', 'video/ogg', 'video/wmv'
    ],
    
    // Rozszerzenia plikÃ³w - wszystkie mobilne
    ALLOWED_EXTENSIONS: [
        // ZdjÄ™cia
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
                "Carpaccio z Å‚ososia z kaparami",
                "Bruschetta z pomidorami i bazyliÄ…",
                "Tartar z tuÅ„czyka"
            ]
        },
        {
            category: "Zupy",
            items: [
                "Å»urek na Å¼eberkach",
                "Krem z dyni z grzankami"
            ]
        },
        {
            category: "Dania gÅ‚Ã³wne",
            items: [
                "Stek woÅ‚owy z ziemniakami grillowanymi",
                "ÅosoÅ› z warzywami sezonowymi",
                "PierÅ› z kaczki z sosem wiÅ›niowym"
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
            category: "Wina biaÅ‚e",
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
    
    // Timeout dla upload (10 minut - zwiększone z 5 minut)
    UPLOAD_TIMEOUT: 10 * 60 * 1000, // 10 minutes (increased from 5 minutes)
    
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