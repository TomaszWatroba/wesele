// api-routes.js - API endpoints for the wedding website
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const config = require('./config');
const { logActivity, logError } = require('./utils');

const router = express.Router();

// File upload storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.originalname.toLowerCase().endsWith('.heic') ||
        file.originalname.toLowerCase().endsWith('.heif')) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type'), false);
    }
};

// Configure multer
const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: config.MAX_FILE_SIZE || 20 * 1024 * 1024, // Default 20MB if not configured
        files: config.MAX_FILES_PER_UPLOAD || 20 // Default 20 files if not configured
    },
    fileFilter: fileFilter
});

// GET /api/gallery - Get all gallery items
router.get('/gallery', (req, res) => {
    try {
        // Read gallery data from JSON file
        const galleryPath = path.join(__dirname, 'data', 'gallery.json');
        
        if (!fs.existsSync(galleryPath)) {
            logActivity('INFO', 'Gallery file not found, returning empty array', '', req.requestId);
            return res.json([]);
        }
        
        const galleryData = JSON.parse(fs.readFileSync(galleryPath, 'utf8'));
        logActivity('INFO', `Retrieved ${galleryData.length} gallery items`, '', req.requestId);
        res.json(galleryData);
    } catch (error) {
        logError(error, 'Failed to get gallery items', req.requestId);
        res.status(500).json({ error: 'Failed to get gallery items' });
    }
});

// POST /api/upload - Upload photos and videos
router.post('/upload', upload.array('files'), async (req, res) => {
    try {
        logActivity('INFO', 'Upload request received', '', req.requestId);
        
        if (!req.files || req.files.length === 0) {
            logActivity('WARN', 'No files uploaded', '', req.requestId);
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const { contributorName, message } = req.body;
        const fileTypes = req.body.fileTypes ? 
            (Array.isArray(req.body.fileTypes) ? req.body.fileTypes : [req.body.fileTypes]) : 
            [];
        
        logActivity('INFO', `Uploading ${req.files.length} files`, 
            `Contributor: ${contributorName}`, req.requestId);
        
        // Ensure thumbnails directory exists
        const thumbnailsDir = path.join(config.UPLOADS_DIR, 'thumbnails');
        if (!fs.existsSync(thumbnailsDir)) {
            fs.mkdirSync(thumbnailsDir, { recursive: true });
            logActivity('INFO', 'Created thumbnails directory', '', req.requestId);
        }
        
        // Process each file and create thumbnails
        const galleryItems = [];
        
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fileType = fileTypes[i] || 
                (file.mimetype.startsWith('image/') ? 'image' : 'video');
            
            logActivity('INFO', `Processing file: ${file.originalname} (${fileType})`, '', req.requestId);
            
            // Generate thumbnail path
            const thumbnailFilename = `thumb_${path.basename(file.filename)}`;
            const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);
            
            try {
                // Generate thumbnail based on file type
                if (fileType === 'image' || file.mimetype.startsWith('image/')) {
                    // Process image with sharp
                    await sharp(file.path)
                        .resize(500, 500, { fit: 'cover' })
                        .toFile(thumbnailPath);
                    
                    logActivity('INFO', `Created image thumbnail for ${file.originalname}`, '', req.requestId);
                } else if (fileType === 'video' || file.mimetype.startsWith('video/')) {
                    // Process video thumbnail with ffmpeg
                    await new Promise((resolve, reject) => {
                        ffmpeg(file.path)
                            .screenshots({
                                timestamps: ['00:00:01.000'],
                                filename: thumbnailFilename,
                                folder: thumbnailsDir,
                                size: '500x500'
                            })
                            .on('end', () => {
                                logActivity('INFO', `Created video thumbnail for ${file.originalname}`, '', req.requestId);
                                resolve();
                            })
                            .on('error', (err) => {
                                logError(err, `Failed to create video thumbnail for ${file.originalname}`, req.requestId);
                                resolve();
                            });
                    });
                }
            } catch (thumbError) {
                logError(thumbError, `Failed to create thumbnail for ${file.originalname}`, req.requestId);
            }
            
            // Add to gallery items
            galleryItems.push({
                id: uuidv4(),
                type: fileType === 'image' || file.mimetype.startsWith('image/') ? 'photo' : 'video',
                url: `/uploads/${file.filename}`,
                thumbnail: `/uploads/thumbnails/${thumbnailFilename}`,
                contributor: contributorName,
                message: message || null,
                filename: file.originalname,
                date: new Date().toISOString()
            });
        }
        
        // Save to gallery data file
        const galleryPath = path.join(__dirname, 'data', 'gallery.json');
        
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            logActivity('INFO', 'Created data directory', '', req.requestId);
        }
        
        // Read existing gallery data
        let galleryData = [];
        if (fs.existsSync(galleryPath)) {
            try {
                const fileContent = fs.readFileSync(galleryPath, 'utf8');
                if (fileContent.trim()) {
                    galleryData = JSON.parse(fileContent);
                }
            } catch (parseError) {
                logError(parseError, 'Failed to parse existing gallery data', req.requestId);
            }
        }
        
        // Add new items and save
        galleryData = Array.isArray(galleryData) ? [...galleryData, ...galleryItems] : galleryItems;
        
        // Write to file
        fs.writeFileSync(galleryPath, JSON.stringify(galleryData, null, 2));
        
        res.json({ 
            success: true, 
            items: galleryItems
        });
    } catch (error) {
        logError(error, 'Failed to upload files', req.requestId);
        res.status(500).json({ error: 'Failed to upload files' });
    }
});

module.exports = router;