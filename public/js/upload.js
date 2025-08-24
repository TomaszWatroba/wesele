// Upload page JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    const status = document.getElementById('status');

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        uploadArea.classList.add('dragover');
    }

    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    async function handleFiles(files) {
        if (files.length === 0) return;

        const formData = new FormData();
        
        for (let file of files) {
            const fileName = file.name.toLowerCase();
            const fileType = file.type.toLowerCase();
            
            // Enhanced file type validation for HEIC/HEIF and other formats
            const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif'];
            const validVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
            const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.heic', '.heif', '.mp4', '.mov', '.avi'];
            
            // Check if file is valid by MIME type OR extension (HEIC files often have empty/generic MIME types)
            const hasValidMimeType = validImageTypes.includes(fileType) || validVideoTypes.includes(fileType);
            const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
            const isEmptyMimeType = !fileType || fileType === 'application/octet-stream' || fileType === '';
            
            // Allow if: valid MIME type OR (valid extension AND (empty MIME OR generic MIME))
            const isValidFile = hasValidMimeType || (hasValidExtension && (isEmptyMimeType || fileType === 'application/octet-stream'));
            
            if (!isValidFile) {
                showStatus('File "' + file.name + '" is not supported. Only photos and videos are allowed.', 'error');
                console.log('File validation failed:', {
                    fileName: file.name,
                    fileType: file.type,
                    hasValidMimeType,
                    hasValidExtension,
                    isEmptyMimeType
                });
                return;
            }
            
            console.log('File accepted:', {
                fileName: file.name,
                fileType: file.type || 'empty',
                size: Math.round(file.size / 1024) + 'KB'
            });
            
            formData.append('photos', file);
        }

        try {
            progressContainer.style.display = 'block';
            showStatus('Uploading photos...', 'info');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': ' + response.statusText);
            }

            const result = await response.json();
            showStatus('Successfully uploaded ' + files.length + ' file(s)!', 'success');
            
            // Show uploaded files preview
            displayUploadedFiles(result.files);
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
            }, 2000);

        } catch (error) {
            console.error('Upload error:', error);
            showStatus('Upload failed: ' + error.message, 'error');
            progressContainer.style.display = 'none';
        }
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = 'status ' + type;
        
        // Simulate progress for user feedback
        if (type === 'info') {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 30;
                if (progress > 90) progress = 90;
                progressBar.style.width = progress + '%';
                
                if (progress >= 90) {
                    clearInterval(interval);
                }
            }, 200);
        } else {
            progressBar.style.width = '100%';
        }
    }

    function displayUploadedFiles(files) {
        const uploadedPhotos = document.getElementById('uploadedPhotos');
        
        if (!files || files.length === 0) return;
        
        const filesHtml = files.map(file => {
            const isVideo = file.type && file.type.startsWith('video/');
            const fileName = file.original || file.saved;
            const fileSize = formatFileSize(file.size);
            
            return '<div class="uploaded-file">' +
                '<div class="file-info">' +
                    '<span class="file-icon">' + (isVideo ? '🎬' : '📷') + '</span>' +
                    '<div class="file-details">' +
                        '<div class="file-name">' + fileName + '</div>' +
                        '<div class="file-size">' + fileSize + '</div>' +
                    '</div>' +
                    '<span class="file-status">✅</span>' +
                '</div>' +
            '</div>';
        }).join('');
        
        uploadedPhotos.innerHTML = 
            '<h3>✅ Successfully Uploaded Files:</h3>' +
            '<div class="files-grid">' +
                filesHtml +
            '</div>' +
            '<div class="upload-summary">' +
                '<p>📁 ' + files.length + ' file(s) uploaded successfully</p>' +
                '<p>💾 Total size: ' + formatFileSize(files.reduce(function(sum, f) { return sum + (f.size || 0); }, 0)) + '</p>' +
                '<button onclick="location.reload()" class="upload-btn" style="margin-top: 15px;">Upload More Files</button>' +
            '</div>';
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
    }
});