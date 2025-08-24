const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Admin panel route
router.get('/', (req, res) => {
    try {
        // Read the HTML template
        const adminHTMLPath = path.join(__dirname, '../views/admin.html');
        const adminHTML = fs.readFileSync(adminHTMLPath, 'utf8');
        res.send(adminHTML);
    } catch (error) {
        console.error('Error loading admin page:', error);
        res.status(500).send('Error loading admin page');
    }
});

module.exports = router;