// routes/admin-routes.js - Admin Panel Routes
const express = require('express');
const config = require('../config/base-config');
const { logActivity } = require('../utils/logging');
const { renderTemplate } = require('../utils/template-utils');

const router = express.Router();

// Admin login page
router.get('/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    
    res.send(renderTemplate('admin-login', {
        ERROR_MESSAGE: '',
        PAGE_TITLE: 'Panel administratora - Logowanie'
    }));
});

// Admin login handler
router.post('/login', (req, res) => {
    const { password } = req.body;
    
    if (password === config.ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        logActivity('SUCCESS', 'Admin login successful', '', req.requestId, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        res.redirect('/admin');
    } else {
        logActivity('WARN', 'Admin login failed', '', req.requestId, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        
        res.send(renderTemplate('admin-login', {
            ERROR_MESSAGE: '<div class="error-message">Invalid password. Please try again.</div>',
            PAGE_TITLE: 'Panel administratora - Logowanie'
        }));
    }
});

// Admin logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Protected admin panel
router.get('/', (req, res) => {
    if (!req.session.isAdmin) {
        return res.redirect('/admin/login');
    }
    
    logActivity('INFO', 'Admin panel accessed', '', req.requestId);
    
    res.send(renderTemplate('admin-panel', {
        BRIDE_NAME: config.COUPLE_NAMES.bride,
        GROOM_NAME: config.COUPLE_NAMES.groom,
        PAGE_TITLE: `Panel administratora - ${config.COUPLE_NAMES.bride} & ${config.COUPLE_NAMES.groom}`
    }));
});

module.exports = router;