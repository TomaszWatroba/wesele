

const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Upload page route
router.get('/', (req, res) => {
    try {
        // Read the HTML template
        const uploadHTMLPath = path.join(__dirname, '../views/upload.html');
        const uploadHTML = fs.readFileSync(uploadHTMLPath, 'utf8');
        res.send(uploadHTML);
    } catch (error) {
        console.error('Error loading upload page:', error);
        res.status(500).send('Error loading upload page');
    }
});

module.exports = router;