// utils/file-operations.js - File handling utilities
const fs = require('fs');
const path = require('path');
const config = require('../config/base-config');
const uploadConfig = require('../config/upload-config');
const { logActivity, logError } = require('./logging');

// Enhanced file type detection with logging
const getFileType = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    logActivity('DEBUG', 'File type detection', `${filename} -> ${ext}`);
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', 
                       '.heics', '.heifs', '.avif', '.jfif', '.pjpeg', '.tiff', '.tif', '.bmp'];
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.3gp', '.3g2', 
                       '.m4v', '.wmv', '.flv', '.ogv', '.quicktime'];
    
    if (imageExts.includes(ext)) {
        return 'image/' + ext.substring(1);
    } else if (videoExts.includes(ext)) {
        return 'video/' + ext.substring(1);
    }
    
    logActivity('WARN', 'Unknown file type', filename);
    return 'unknown';
};

// Generate safe filename with logging
const generateSafeFilename = (originalName) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFilename = `${timestamp}_${randomString}_${safeOriginalName}`;
    
    logActivity('DEBUG', 'Filename generated', `${originalName} -> ${newFilename}`);
    return newFilename;
};

// Enhanced file listing with error handling
const getUploadedFiles = () => {
    try {
        const files = fs.readdirSync(config.UPLOADS_DIR).map(filename => {
            try {
                const filepath = path.join(config.UPLOADS_DIR, filename);
                const stats = fs.statSync(filepath);
                
                return {
                    name: filename,
                    size: stats.size,
                    created: stats.birthtime,
                    type: getFileType(filename)
                };
            } catch (error) {
                logError(error, `Failed to read file stats: ${filename}`);
                return null;
            }
        }).filter(Boolean).sort((a, b) => b.created - a.created);
        
        logActivity('DEBUG', 'Files loaded', `${files.length} files from ${config.UPLOADS_DIR}`);
        return files;
    } catch (error) {
        logError(error, 'Failed to read uploads directory');
        return [];
    }
};

// File statistics generation
const generateFileStats = (files) => {
    const photos = files.filter(f => f.type && f.type.startsWith('image')).length;
    const videos = files.filter(f => f.type && f.type.startsWith('video')).length;
    const totalSize = Math.round(files.reduce((sum, f) => sum + (f.size || 0), 0) / 1024 / 1024);
    
    const stats = { photos, videos, totalSize, totalFiles: files.length };
    
    logActivity('DEBUG', 'File stats generated', '', null, stats);
    return stats;
};

// Enhanced cleanup with detailed logging
const cleanupOldFiles = (daysOld = 30) => {
    try {
        const files = fs.readdirSync(config.UPLOADS_DIR);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        let deletedCount = 0;
        let deletedSize = 0;
        
        files.forEach(filename => {
            try {
                const filepath = path.join(config.UPLOADS_DIR, filename);
                const stats = fs.statSync(filepath);
                
                if (stats.birthtime < cutoffDate) {
                    deletedSize += stats.size;
                    fs.unlinkSync(filepath);
                    deletedCount++;
                    logActivity('INFO', 'File deleted', filename);
                }
            } catch (error) {
                logError(error, `Failed to delete file: ${filename}`);
            }
        });
        
        if (deletedCount > 0) {
            logActivity('SUCCESS', 'Cleanup completed', '', null, {
                deletedFiles: deletedCount,
                deletedSize: `${Math.round(deletedSize / 1024 / 1024)}MB`,
                daysOld
            });
        } else {
            logActivity('INFO', 'Cleanup completed', 'No files to delete');
        }
        
        return deletedCount;
    } catch (error) {
        logError(error, 'Cleanup failed');
        return 0;
    }
};

// Validate file type and size
const validateFile = (file) => {
    const fileName = file.originalname.toLowerCase();
    const mimeType = file.mimetype || '';
    const ext = path.extname(fileName);
    
    // Check dangerous extensions
    if (uploadConfig.BANNED_EXTENSIONS.includes(ext)) {
        return {
            valid: false,
            error: `Zabroniony typ pliku - potencjalnie niebezpieczny: ${ext}`
        };
    }
    
    // Check file size
    if (file.size && file.size > uploadConfig.MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Plik za duży: ${Math.round(file.size / 1024 / 1024)}MB (max: ${Math.round(uploadConfig.MAX_FILE_SIZE / 1024 / 1024)}MB)`
        };
    }
    
    // Check allowed types
    const isValidMimeType = uploadConfig.ALLOWED_FILE_TYPES.includes(mimeType);
    const isValidExtension = uploadConfig.ALLOWED_EXTENSIONS.includes(ext);
    const isEmptyMimeType = !mimeType || mimeType === 'application/octet-stream';
    
    const isValidFile = isValidMimeType || (isValidExtension && (isEmptyMimeType || mimeType === 'application/octet-stream'));
    
    if (!isValidFile) {
        return {
            valid: false,
            error: `Nieobsługiwany typ pliku: ${ext} (${mimeType}) - dozwolone tylko zdjęcia i filmy`
        };
    }
    
    return { valid: true };
};

// Format file size helper
const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
};

module.exports = {
    getFileType,
    generateSafeFilename,
    getUploadedFiles,
    generateFileStats,
    cleanupOldFiles,
    validateFile,
    formatFileSize
};