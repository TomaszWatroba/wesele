// config/base-config.js - Basic Application Configuration
const path = require('path');
require('dotenv').config();

module.exports = {
    // Basic settings
    PORT: process.env.PORT || 3000,
    EVENT_NAME: 'Nasze Wesele 2025',
    
    // Admin settings
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'wedding2025!',
    ADMIN_SESSION_SECRET: process.env.SESSION_SECRET || 'wedding-secret-change-this',
    
    // Couple information
    COUPLE_NAMES: {
        bride: "Gosia",
        groom: "Tomek"
    },
    
    // Wedding details
    WEDDING_DATE: '2025-10-10',
    VENUE: 'Sala Weselna "Biały Dom" Paniówki',
    DOMAIN: 'gosiaitomek.pl',
    CUSTOM_DOMAIN: process.env.CUSTOM_DOMAIN || 'gosiaitomek.pl',
    
    // Paths
    UPLOADS_DIR: path.join(__dirname, '../wedding-photos'),
    LOG_FILE: path.join(__dirname, '../wedding-log.txt'),
    
    // Dynamic URL configuration
    PUBLIC_URL: process.env.PUBLIC_URL || null,
    
    // Function to get the correct base URL
    getBaseURL: function(req) {
        if (this.PUBLIC_URL) {
            return this.PUBLIC_URL;
        }
        
        const host = req.get('Host');
        const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        
        // Detect tunnel
        if (host && (host.includes('cloudflare') || host.includes('trycloudflare.com') || host.includes('.ngrok.io'))) {
            return `https://${host}`;
        }
        
        // Use custom domain if configured
        if (this.CUSTOM_DOMAIN && this.CUSTOM_DOMAIN !== 'localhost') {
            return `https://${this.CUSTOM_DOMAIN}`;
        }
        
        return `${protocol}://${host}`;
    }
};