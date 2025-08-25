const express = require('express');
const path = require('path');

const router = express.Router();

// Import route modules
const uploadRoute = require('./routes/upload');
const adminRoute = require('./routes/admin');
const homeRoute = require('./routes/home');
const galleryRoute = require('./routes/gallery'); // Add this line
const menuItems = require('./data/menuItems');
const coupleInfo = require('./data/coupleInfo');
// Use route modules
router.use('/upload', uploadRoute);
router.use('/admin', adminRoute);
router.use('/gallery', galleryRoute); // Add this line
router.use('/', homeRoute);
app.get('/menu', (req, res) => {
  res.render('menu', { 
    menuItems: menuItems,
    coupleInfo: coupleInfo
  });
});


module.exports = router;