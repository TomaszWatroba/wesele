const express = require('express');
const router = express.Router();

// Home page route - redirect to admin
router.get('/', (req, res) => {
    res.redirect('/admin');
});

module.exports = router;