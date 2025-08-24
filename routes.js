const express = require('express');
const path = require('path');

const router = express.Router();

// Import route modules
const uploadRoute = require('./routes/upload');
const adminRoute = require('./routes/admin');
const homeRoute = require('./routes/home');

// Use route modules
router.use('/upload', uploadRoute);
router.use('/admin', adminRoute);
router.use('/', homeRoute);

module.exports = router;