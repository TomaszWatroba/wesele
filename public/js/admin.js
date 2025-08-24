// Admin panel JavaScript functionality - Fixed Syntax Errors
document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentQRData = null;
    let publicUrlData = null;

    // Helper functions
    function showStatus(message, type) {
        const statusMessages = document.getElementById('statusMessages');
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status ' + type;
        statusDiv.textContent = message;
        statusMessages.appendChild(statusDiv);
        
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 5000);
        
        statusDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024) * 10) / 10 + ' MB';
    }

    // Main functions
async function checkStatus() {
    console.log('Checking status...');
    const refreshBtn = document.getElementById('refreshBtn');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const currentUrl = document.getElementById('currentUrl');

    try {
        refreshBtn.innerHTML = '<div class="loading"></div>Checking...';
        refreshBtn.disabled = true;
        
        statusText.textContent = 'Checking connection...';
        statusIndicator.className = 'indicator inactive';

        // Check if we should force tunnel detection
        const urlParams = new URLSearchParams(window.location.search);
        const forceTunnel = urlParams.get('force') === 'tunnel';
        
        // Add force parameter to API call if needed
        const apiUrl = forceTunnel ? 
            '/api/public-url?force=tunnel' : 
            '/api/public-url';
        
        console.log('Making API call to:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        publicUrlData = await response.json();
        console.log('Public URL data:', publicUrlData);

        const isTunnelActive = publicUrlData.tunnelActive;
        statusIndicator.className = isTunnelActive ? 'indicator active' : 'indicator inactive';
        statusText.textContent = isTunnelActive ? 
            'Cloudflare tunnel is active' : 
            'No tunnel detected - Local access only';
        
        currentUrl.textContent = publicUrlData.uploadURL;

        showStatus(
            isTunnelActive ? 
                'Tunnel detected! QR codes will use public URL.' : 
                'Using localhost. Start Cloudflare tunnel for public access.',
            isTunnelActive ? 'success' : 'info'
        );

    } catch (error) {
        console.error('Status check failed:', error);
        statusIndicator.className = 'indicator inactive';
        statusText.textContent = 'Connection check failed';
        currentUrl.textContent = 'Error loading URL';
        showStatus('Failed to check connection status: ' + error.message, 'error');
    } finally {
        refreshBtn.innerHTML = '🔄 Refresh Status';
        refreshBtn.disabled = false;
    }
}

    async function generateUploadQR() {
        console.log('Generating QR code...');
        const generateBtn = document.getElementById('generateBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const qrDisplay = document.getElementById('qrDisplay');
        const qrInfo = document.getElementById('qrInfo');
        const qrUrl = document.getElementById('qrUrl');

        try {
            generateBtn.innerHTML = '<div class="loading"></div>Generating...';
            generateBtn.disabled = true;
            
            qrDisplay.innerHTML = '<div class="loading"></div><p>Generating QR code...</p>';

            const response = await fetch('/api/qr-upload');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'HTTP ' + response.status);
            }
            
            const result = await response.json();
            console.log('QR generation result:', result);

            if (result.success) {
                qrDisplay.innerHTML = '<img src="' + result.qrCode + '" alt="Upload QR Code" class="qr-image">';
                qrUrl.textContent = result.uploadUrl;
                qrInfo.style.display = 'block';
                
                currentQRData = {
                    dataURL: result.qrCode,
                    url: result.uploadUrl
                };
                
                downloadBtn.disabled = false;
                showStatus(result.message || 'QR code generated successfully!', 'success');
            } else {
                throw new Error(result.error || 'QR generation failed');
            }
        } catch (error) {
            console.error('QR generation failed:', error);
            qrDisplay.innerHTML = '<div style="color: #dc3545;"><p>Failed to generate QR code</p><p style="font-size: 14px;">' + error.message + '</p></div>';
            showStatus('QR generation failed: ' + error.message, 'error');
        } finally {
            generateBtn.innerHTML = '📷 Generate Upload QR Code';
            generateBtn.disabled = false;
        }
    }

    function downloadQRCode() {
        if (!currentQRData) {
            showStatus('No QR code available to download', 'error');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = 'wedding-upload-qr-' + Date.now() + '.png';
            link.href = currentQRData.dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showStatus('QR code downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download failed:', error);
            showStatus('Download failed: ' + error.message, 'error');
        }
    }

    // Gallery functions
    async function loadGallery() {
        console.log('Loading gallery with previews...');
        const refreshBtn = document.getElementById('refreshGalleryBtn');
        const galleryGrid = document.getElementById('galleryGrid');
        const galleryStats = document.getElementById('galleryStats');
        
        try {
            refreshBtn.innerHTML = '<div class="loading"></div>Loading...';
            refreshBtn.disabled = true;
            
            galleryGrid.innerHTML = '<p>Loading files...</p>';
            galleryStats.textContent = 'Loading...';
            
            const response = await fetch('/api/files');
            
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            
            const files = await response.json();
            console.log('Gallery loaded:', files.length, 'files');
            
            if (files.length === 0) {
                galleryGrid.innerHTML = '<p style="text-align: center; color: #666;">No files uploaded yet. Share the QR code with guests to start collecting photos!</p>';
                galleryStats.textContent = 'No files';
                return;
            }
            
            const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
            galleryStats.innerHTML = files.length + ' files • ' + formatFileSize(totalSize);
            
            const galleryHTML = files.map(function(file) {
                const fileName = file.name || 'Unknown file';
                const fileSize = formatFileSize(file.size || 0);
                const fileDate = new Date(file.created).toLocaleDateString();
                const fileExt = fileName.split('.').pop().toLowerCase();
                
                const isImage = file.type && (file.type.startsWith('image/') || ['heic', 'heif'].includes(fileExt));
                const isVideo = file.type && file.type.startsWith('video/');
                const isHEIC = ['heic', 'heif'].includes(fileExt);
                
                let previewContent;
                if (isImage) {
                    previewContent = 
                        '<img src="/api/preview/' + encodeURIComponent(file.name) + '?size=200" ' +
                        'alt="' + fileName + '" ' +
                        'style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;" ' +
                        'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'" ' +
                        'onload="this.nextElementSibling.style.display=\'none\'">' +
                        '<div style="display: flex; align-items: center; justify-content: center; font-size: 40px; color: #666; flex-direction: column;">' +
                            (isHEIC ? '🎁' : '📷') +
                            '<div style="font-size: 12px; margin-top: 5px;">' + (isHEIC ? 'HEIC' : 'IMAGE') + '</div>' +
                        '</div>';
                } else if (isVideo) {
                    previewContent = 
                        '<div style="display: flex; align-items: center; justify-content: center; font-size: 40px; color: #666; flex-direction: column; position: relative;">' +
                            '🎬' +
                            '<div style="font-size: 12px; margin-top: 5px;">.' + fileExt.toUpperCase() + '</div>' +
                            '<div class="video-badge">VIDEO</div>' +
                        '</div>';
                } else {
                    previewContent = 
                        '<div style="display: flex; align-items: center; justify-content: center; font-size: 40px; color: #666; flex-direction: column;">' +
                            '📄' +
                            '<div style="font-size: 12px; margin-top: 5px;">.' + fileExt.toUpperCase() + '</div>' +
                        '</div>';
                }
                
                return '<div class="gallery-item">' +
                    '<div class="file-preview" onclick="viewFullMedia(\'' + file.name + '\', \'' + (isVideo ? 'video' : 'image') + '\')">' +
                        previewContent +
                    '</div>' +
                    '<div class="file-name" title="' + fileName + '">' +
                        (fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName) +
                    '</div>' +
                    '<div class="file-details">' +
                        fileSize + ' • ' + fileDate +
                        (isHEIC ? ' • HEIC' : '') +
                        (isVideo ? ' • VIDEO' : '') +
                    '</div>' +
                    '<div class="file-actions">' +
                        '<button class="btn small" onclick="downloadFile(\'' + file.name + '\')">📥 Download</button>' +
                        (isImage ? '<button class="btn small" onclick="viewFullMedia(\'' + file.name + '\', \'image\')">👁️ View</button>' : '') +
                        (isVideo ? '<button class="btn small" onclick="viewFullMedia(\'' + file.name + '\', \'video\')">▶️ Play</button>' : '') +
                    '</div>' +
                '</div>';
            }).join('');
            
            galleryGrid.innerHTML = galleryHTML;
            showStatus('Gallery loaded: ' + files.length + ' files', 'success');
            
        } catch (error) {
            console.error('Gallery load failed:', error);
            galleryGrid.innerHTML = '<p style="color: #dc3545;">Failed to load gallery. Please try again.</p>';
            galleryStats.textContent = 'Error loading files';
            showStatus('Failed to load gallery: ' + error.message, 'error');
        } finally {
            refreshBtn.innerHTML = '🔄 Refresh Gallery';
            refreshBtn.disabled = false;
        }
    }

    async function downloadAllFiles() {
        console.log('Downloading all files...');
        const downloadBtn = document.getElementById('downloadAllBtn');
        
        try {
            downloadBtn.innerHTML = '<div class="loading"></div>Creating ZIP...';
            downloadBtn.disabled = true;
            
            showStatus('Creating ZIP archive... This may take a moment.', 'info');
            
            const link = document.createElement('a');
            link.href = '/api/download-all';
            link.download = 'wedding-photos.zip';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showStatus('Download started! Check your downloads folder.', 'success');
            
        } catch (error) {
            console.error('Download failed:', error);
            showStatus('Download failed: ' + error.message, 'error');
        } finally {
            downloadBtn.innerHTML = '📦 Download All Files';
            downloadBtn.disabled = false;
        }
    }

    function downloadFile(filename) {
        if (!filename) {
            showStatus('Invalid filename', 'error');
            return;
        }
        
        try {
            const link = document.createElement('a');
            link.href = '/uploads/' + encodeURIComponent(filename);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showStatus('Download started: ' + filename, 'success');
        } catch (error) {
            console.error('Download failed:', error);
            showStatus('Download failed', 'error');
        }
    }

    function viewFullMedia(filename, type) {
        console.log('Viewing ' + type + ':', filename);
        if (!filename) {
            showStatus('Invalid filename', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.style.cssText = 
            'position: fixed;' +
            'top: 0;' +
            'left: 0;' +
            'width: 100%;' +
            'height: 100%;' +
            'background: rgba(0, 0, 0, 0.9);' +
            'display: flex;' +
            'align-items: center;' +
            'justify-content: center;' +
            'z-index: 1000;' +
            'cursor: pointer;';
        
        const container = document.createElement('div');
        container.style.cssText = 
            'max-width: 90%;' +
            'max-height: 90%;' +
            'text-align: center;' +
            'position: relative;';
        
        const loading = document.createElement('div');
        loading.innerHTML = '<div class="loading"></div><p style="color: white;">Loading ' + type + '...</p>';
        loading.style.cssText = 
            'color: white;' +
            'text-align: center;' +
            'padding: 40px;';
        container.appendChild(loading);
        
        let mediaElement;
        
        if (type === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.src = '/uploads/' + encodeURIComponent(filename);
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            mediaElement.style.cssText = 
                'max-width: 100%;' +
                'max-height: 100%;' +
                'border-radius: 8px;' +
                'box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);' +
                'display: none;';
            
            mediaElement.addEventListener('loadeddata', function() {
                loading.style.display = 'none';
                mediaElement.style.display = 'block';
                addMediaControls();
            });
            
            mediaElement.addEventListener('error', function() {
                loading.innerHTML = 
                    '<div style="color: white; text-align: center; padding: 40px;">' +
                        '<div style="font-size: 60px; margin-bottom: 20px;">🎬</div>' +
                        '<h3>Video Cannot Be Played</h3>' +
                        '<p>This video format may not be supported by your browser.</p>' +
                        '<p style="font-size: 14px; margin-top: 20px; opacity: 0.8;">' + filename + '</p>' +
                        '<div style="margin-top: 30px;">' +
                            '<button onclick="downloadFile(\'' + filename + '\')" class="btn" style="margin: 5px;">📥 Download Original File</button>' +
                        '</div>' +
                    '</div>';
            });
            
        } else {
            mediaElement = document.createElement('img');
            mediaElement.src = '/api/preview/' + encodeURIComponent(filename) + '?size=1200';
            mediaElement.alt = filename;
            mediaElement.style.cssText = 
                'max-width: 100%;' +
                'max-height: 100%;' +
                'border-radius: 8px;' +
                'box-shadow: 0 4px 20px rgba(255, 255, 255, 0.1);' +
                'display: none;';
            
            mediaElement.onload = function() {
                loading.style.display = 'none';
                mediaElement.style.display = 'block';
                addMediaControls();
            };
            
            mediaElement.onerror = function() {
                loading.innerHTML = 
                    '<div style="color: white; text-align: center; padding: 40px;">' +
                        '<div style="font-size: 60px; margin-bottom: 20px;">🎁</div>' +
                        '<h3>Preview Not Available</h3>' +
                        '<p>This file format cannot be displayed directly in the browser.</p>' +
                        '<p style="font-size: 14px; margin-top: 20px; opacity: 0.8;">' + filename + '</p>' +
                        '<div style="margin-top: 30px;">' +
                            '<button onclick="downloadFile(\'' + filename + '\')" class="btn" style="margin: 5px;">📥 Download Original File</button>' +
                        '</div>' +
                    '</div>';
            };
        }
        
        function addMediaControls() {
            const label = document.createElement('div');
            label.textContent = filename;
            label.style.cssText = 
                'color: white;' +
                'background: rgba(0, 0, 0, 0.7);' +
                'padding: 10px 20px;' +
                'border-radius: 20px;' +
                'margin-top: 20px;' +
                'display: inline-block;' +
                'font-size: 14px;';
            
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '✕';
            closeBtn.style.cssText = 
                'position: absolute;' +
                'top: -10px;' +
                'right: -10px;' +
                'background: rgba(255, 255, 255, 0.9);' +
                'border: none;' +
                'border-radius: 50%;' +
                'width: 40px;' +
                'height: 40px;' +
                'font-size: 20px;' +
                'cursor: pointer;' +
                'color: #333;' +
                'display: flex;' +
                'align-items: center;' +
                'justify-content: center;';
            
            closeBtn.onclick = function(e) {
                e.stopPropagation();
                if (type === 'video' && mediaElement.pause) {
                    mediaElement.pause();
                }
                document.body.removeChild(modal);
            };
            
            container.appendChild(label);
            container.appendChild(closeBtn);
        }
        
        container.appendChild(mediaElement);
        modal.appendChild(container);
        
        modal.onclick = function(e) {
            if (e.target === modal) {
                if (type === 'video' && mediaElement.pause) {
                    mediaElement.pause();
                }
                document.body.removeChild(modal);
            }
        };
        
        const keyHandler = function(e) {
            if (e.key === 'Escape') {
                if (type === 'video' && mediaElement.pause) {
                    mediaElement.pause();
                }
                document.body.removeChild(modal);
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);
        
        document.body.appendChild(modal);
        
        showStatus('Opening ' + type + ' viewer: ' + filename, 'info');
    }

    // Event listeners
    console.log('Admin panel loaded with enhanced previews');
    
    document.getElementById('refreshBtn').addEventListener('click', checkStatus);
    document.getElementById('generateBtn').addEventListener('click', generateUploadQR);
    document.getElementById('downloadBtn').addEventListener('click', downloadQRCode);
    document.getElementById('refreshGalleryBtn').addEventListener('click', loadGallery);
    document.getElementById('downloadAllBtn').addEventListener('click', downloadAllFiles);
    
    // Initialize
    checkStatus();
    loadGallery();

    // Auto-refresh status every 30 seconds
    setInterval(checkStatus, 30000);

    // Make functions global so onclick handlers work
    window.viewFullMedia = viewFullMedia;
    window.downloadFile = downloadFile;
});