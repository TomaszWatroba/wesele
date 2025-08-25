// routes/gallery.js - Gallery route handler
const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Gallery page route
router.get('/', (req, res) => {
    try {
        // Read the HTML template
        const galleryHTMLPath = path.join(__dirname, '../views/gallery.html');
        const galleryHTML = fs.readFileSync(galleryHTMLPath, 'utf8');
        res.send(galleryHTML);
    } catch (error) {
        console.error('Error loading gallery page:', error);
        res.status(500).send('Error loading gallery page');
    }
});

module.exports = router;