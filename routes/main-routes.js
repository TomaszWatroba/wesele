// routes/main-routes.js - Main Website Routes
const express = require('express');
const config = require('../config/base-config');
const weddingConfig = require('../config/wedding-config');
const { logActivity } = require('../utils/logging');
const { renderTemplate } = require('../utils/template-utils');

const router = express.Router();

// Home page
router.get('/', (req, res) => {
    logActivity('INFO', 'Home page accessed', '', req.requestId);
    
    const weddingDate = new Date(config.WEDDING_DATE).toLocaleDateString('pl-PL', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    res.send(renderTemplate('home', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        WEDDING_DATE: weddingDate,
        PAGE_TITLE: `${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom} - Wesele`
    }));
});

// Photo upload page
router.get('/photos', (req, res) => {
    logActivity('INFO', 'Photo upload page accessed', '', req.requestId);
    
    res.send(renderTemplate('upload', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Podziel się zdjęciami - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Gallery page
router.get('/gallery', (req, res) => {
    logActivity('INFO', 'Gallery page accessed', '', req.requestId);
    
    res.send(renderTemplate('gallery', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Galeria - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Menu page
router.get('/menu', (req, res) => {
    logActivity('INFO', 'Menu page accessed', '', req.requestId);
    
    res.send(renderTemplate('menu', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Menu - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Drinks page
router.get('/drinks', (req, res) => {
    logActivity('INFO', 'Drinks page accessed', '', req.requestId);
    
    res.send(renderTemplate('drinks', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Napoje - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Timeline page
router.get('/timeline', (req, res) => {
    logActivity('INFO', 'Timeline page accessed', '', req.requestId);
    
    res.send(renderTemplate('timeline', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Plan dnia - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Providers page
router.get('/providers', (req, res) => {
    logActivity('INFO', 'Providers page accessed', '', req.requestId);
    
    res.send(renderTemplate('providers', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Nasi partnerzy - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Story page
router.get('/story', (req, res) => {
    logActivity('INFO', 'Story page accessed', '', req.requestId);
    
    res.send(renderTemplate('story', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Nasza historia - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

// Seating page
router.get('/seating', (req, res) => {
    logActivity('INFO', 'Seating page accessed', '', req.requestId);
    
    res.send(renderTemplate('seating', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Plan miejsc - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

module.exports = router;