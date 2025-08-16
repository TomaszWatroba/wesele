// middleware/index.js - Main middleware exports
// This file combines all middleware modules for easy importing

// Import all middleware modules
const { upload, debugUpload } = require('./upload');
const { uploadLimiter, securityMiddleware, protectFilesMiddleware } = require('./security');
const { notFoundHandler, errorHandler } = require('./error');
const { timeoutMiddleware, memoryMonitor, performanceMonitor, healthMonitor } = require('./monitoring');

// Export all middleware for use in server.js
module.exports = {
    // Upload handling
    upload,
    debugUpload,
    
    // Security & rate limiting
    uploadLimiter,
    securityMiddleware,
    protectFilesMiddleware,
    
    // Error handling
    notFoundHandler,
    errorHandler,
    
    // Performance & monitoring
    timeoutMiddleware,
    memoryMonitor,
    performanceMonitor,
    healthMonitor
};