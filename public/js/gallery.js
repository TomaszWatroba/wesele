document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const galleryGrid = document.getElementById('galleryGrid');
    const galleryStats = document.getElementById('galleryStats');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const typeFilter = document.getElementById('typeFilter');
    const sortFilter = document.getElementById('sortFilter');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    const statusMessages = document.getElementById('statusMessages');
    
    // Variables
    let allFiles = [];
    let displayedFiles = [];
    let currentPage = 1;
    const filesPerPage = 20;
    let currentSearchQuery = '';
    let currentTypeFilter = 'all';
    let currentSortFilter = 'date';
    
    // Initialize the gallery
    loadGallery();
    
    // Event listeners
    searchBtn.addEventListener('click', function() {
        currentSearchQuery = searchInput.value.trim().toLowerCase();
        currentPage = 1;
        filterAndDisplayFiles();
    });
    
    searchInput.addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            currentSearchQuery = searchInput.value.trim().toLowerCase();
            currentPage = 1;
            filterAndDisplayFiles();
        }
    });
    
    typeFilter.addEventListener('change', function() {
        currentTypeFilter = this.value;
        currentPage = 1;
        filterAndDisplayFiles();
    });
    
    sortFilter.addEventListener('change', function() {
        currentSortFilter = this.value;
        currentPage = 1;
        filterAndDisplayFiles();
    });
    
    loadMoreBtn.addEventListener('click', function() {
        currentPage++;
        displayMoreFiles();
    });
    
    // Function to load all gallery files
    async function loadGallery() {
        showLoading();
        
        try {
            const response = await fetch('/api/files');
            
            if (!response.ok) {
                throw new Error('Error loading gallery: ' + response.status);
            }
            
            allFiles = await response.json();
            
            if (allFiles.length === 0) {
                galleryGrid.innerHTML = '<p class="empty-gallery">No files have been uploaded yet.</p>';
                galleryStats.textContent = 'No files';
                hideLoading();
                return;
            }
            
            // Initialize filters and display
            filterAndDisplayFiles();
            showStatus('Gallery loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Gallery load failed:', error);
            galleryGrid.innerHTML = '<p class="error-message">Failed to load gallery. Please try again.</p>';
            galleryStats.textContent = 'Error loading files';
            showStatus('Failed to load gallery: ' + error.message, 'error');
        }
    }
    
    // Function to filter and display files
    function filterAndDisplayFiles() {
        // Apply filters
        let filteredFiles = allFiles;
        
        // Apply search filter
        if (currentSearchQuery) {
            filteredFiles = filteredFiles.filter(file => 
                file.name.toLowerCase().includes(currentSearchQuery)
            );
        }
        
        // Apply type filter
        if (currentTypeFilter !== 'all') {
            filteredFiles = filteredFiles.filter(file => 
                file.type.startsWith(currentTypeFilter)
            );
        }
        
        // Apply sort
        switch (currentSortFilter) {
            case 'date':
                filteredFiles.sort((a, b) => new Date(b.created) - new Date(a.created));
                break;
            case 'dateAsc':
                filteredFiles.sort((a, b) => new Date(a.created) - new Date(b.created));
                break;
            case 'name':
                filteredFiles.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'size':
                filteredFiles.sort((a, b) => b.size - a.size);
                break;
        }
        
        // Update stats
        updateGalleryStats(filteredFiles);
        
        // Store filtered files for pagination
        displayedFiles = filteredFiles;
        
        // Display first page
        displayFiles(1);
    }
    
    // Function to display files for a specific page
    function displayFiles(page) {
        currentPage = page;
        
        // Calculate slice indexes
        const startIndex = 0;
        const endIndex = page * filesPerPage;
        
        // Get files for this page
        const filesToDisplay = displayedFiles.slice(startIndex, endIndex);
        
        // Check if we have more pages
        if (endIndex < displayedFiles.length) {
            loadMoreContainer.style.display = 'block';
        } else {
            loadMoreContainer.style.display = 'none';
        }
        
        // Generate HTML
        if (filesToDisplay.length === 0) {
            galleryGrid.innerHTML = '<p class="empty-gallery">No files match your search criteria.</p>';
            return;
        }
        
        galleryGrid.innerHTML = filesToDisplay.map(file => createFileCardHTML(file)).join('');
        
        // Update gallery count
        updateGalleryStats(displayedFiles, filesToDisplay.length);
        
        hideLoading();
    }
    
    // Function to display more files (load more button)
    function displayMoreFiles() {
        displayFiles(currentPage);
    }
    
    // Function to create HTML for a file card
    function createFileCardHTML(file) {
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
                '<img src="/api/preview/' + encodeURIComponent(file.name) + '?size=300" ' +
                'alt="' + fileName + '" ' +
                'loading="lazy" ' +
                'onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'" ' +
                'onload="this.nextElementSibling.style.display=\'none\'">' +
                '<div style="display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; flex-direction: column;">' +
                    (isHEIC ? '🖼' : '📷') +
                    '<div style="font-size: 12px; margin-top: 5px;">' + (isHEIC ? 'HEIC' : 'IMAGE') + '</div>' +
                '</div>';
        } else if (isVideo) {
            previewContent = 
                '<div style="display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; flex-direction: column; position: relative;">' +
                    '🎬' +
                    '<div style="font-size: 12px; margin-top: 5px;">.' + fileExt.toUpperCase() + '</div>' +
                    '<div class="video-badge">VIDEO</div>' +
                '</div>';
        } else {
            previewContent = 
                '<div style="display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; flex-direction: column;">' +
                    '📄' +
                    '<div style="font-size: 12px; margin-top: 5px;">.' + fileExt.toUpperCase() + '</div>' +
                '</div>';
        }
        
        return '<div class="gallery-item">' +
            '<div class="file-preview" onclick="openMediaViewer(\'' + encodeURIComponent(file.name) + '\', \'' + (isVideo ? 'video' : 'image') + '\')">' +
                previewContent +
            '</div>' +
            '<div class="file-name" title="' + fileName + '">' +
                (fileName.length > 20 ? fileName.substring(0, 17) + '...' : fileName) +
            '</div>' +
            '<div class="file-details">' +
                fileSize + ' • ' + fileDate +
                (isHEIC ? ' • HEIC' : '') +
                (isVideo ? ' • VIDEO' : '') +
            '</div>' +
            '<div class="file-actions">' +
                '<button class="btn small" onclick="downloadFile(\'' + encodeURIComponent(file.name) + '\')">📥 Download</button>' +
                (isImage ? '<button class="btn small" onclick="openMediaViewer(\'' + encodeURIComponent(file.name) + '\', \'image\')">👁️ View</button>' : '') +
                (isVideo ? '<button class="btn small" onclick="openMediaViewer(\'' + encodeURIComponent(file.name) + '\', \'video\')">▶️ Play</button>' : '') +
            '</div>' +
        '</div>';
    }
    
    // Function to update gallery stats
    function updateGalleryStats(filteredFiles, displayed) {
        const totalFiles = allFiles.length;
        const filteredCount = filteredFiles.length;
        const displayedCount = displayed || Math.min(filteredCount, currentPage * filesPerPage);
        
        const totalSize = formatFileSize(filteredFiles.reduce((sum, file) => sum + (file.size || 0), 0));
        
        if (filteredCount === totalFiles) {
            galleryStats.textContent = `${displayedCount} of ${totalFiles} files • ${totalSize}`;
        } else {
            galleryStats.textContent = `${displayedCount} of ${filteredCount} matches (${totalFiles} total) • ${totalSize}`;
        }
    }
    
    // Utility functions
    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
    
    function showLoading() {
        galleryGrid.innerHTML = '<div class="loading"></div>';
    }
    
    function hideLoading() {
        // This is handled when content is rendered
    }
    
    function showStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'status ' + type;
        statusDiv.textContent = message;
        
        statusMessages.appendChild(statusDiv);
        
        setTimeout(() => {
            statusDiv.style.opacity = '0';
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.parentNode.removeChild(statusDiv);
                }
            }, 500);
        }, 3000);
    }
    
    // Expose functions to global scope for event handlers
    window.downloadFile = function(filename) {
        try {
            const link = document.createElement('a');
            link.href = '/uploads/' + filename;
            link.download = decodeURIComponent(filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showStatus('Download started!', 'success');
        } catch (error) {
            console.error('Download failed:', error);
            showStatus('Download failed', 'error');
        }
    };
    
    window.openMediaViewer = function(filename, type) {
        const decodedFilename = decodeURIComponent(filename);
        console.log('Opening media viewer for:', decodedFilename, 'Type:', type);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'media-modal';
        
        // Create container
        const container = document.createElement('div');
        container.className = 'media-container';
        
        // Create loading indicator
        const loading = document.createElement('div');
        loading.className = 'loading';
        container.appendChild(loading);
        
        // Create media element
        let mediaElement;
        
        if (type === 'video') {
            mediaElement = document.createElement('video');
            mediaElement.className = 'media-video';
            mediaElement.src = '/uploads/' + filename;
            mediaElement.controls = true;
            mediaElement.autoplay = true;
            mediaElement.style.display = 'none';
            
            mediaElement.addEventListener('loadeddata', function() {
                loading.style.display = 'none';
                mediaElement.style.display = 'block';
            });
            
            mediaElement.addEventListener('error', function() {
                loading.style.display = 'none';
                container.innerHTML += '<div style="color: white; text-align: center; padding: 40px;">' +
                    '<div style="font-size: 60px; margin-bottom: 20px;">🎬</div>' +
                    '<h3>Video Cannot Be Played</h3>' +
                    '<p>This video format may not be supported by your browser.</p>' +
                    '<p style="font-size: 14px; margin-top: 20px; opacity: 0.8;">' + decodedFilename + '</p>' +
                '</div>';
            });
        } else {
            mediaElement = document.createElement('img');
            mediaElement.className = 'media-image';
            mediaElement.src = '/api/preview/' + filename + '?size=1200';
            mediaElement.alt = decodedFilename;
            mediaElement.style.display = 'none';
            
            mediaElement.onload = function() {
                loading.style.display = 'none';
                mediaElement.style.display = 'block';
            };
            
            mediaElement.onerror = function() {
                loading.style.display = 'none';
                container.innerHTML += '<div style="color: white; text-align: center; padding: 40px;">' +
                    '<div style="font-size: 60px; margin-bottom: 20px;">🖼</div>' +
                    '<h3>Image Cannot Be Displayed</h3>' +
                    '<p>This image format may not be supported by your browser.</p>' +
                    '<p style="font-size: 14px; margin-top: 20px; opacity: 0.8;">' + decodedFilename + '</p>' +
                '</div>';
            };
        }
        
        container.appendChild(mediaElement);
        
        // Create info text
        const infoText = document.createElement('div');
        infoText.className = 'media-info';
        infoText.textContent = decodedFilename;
        container.appendChild(infoText);
        
        // Create download button
        const downloadButton = document.createElement('button');
        downloadButton.className = 'media-download';
        downloadButton.innerHTML = '📥 Download Original';
        downloadButton.onclick = function(e) {
            e.stopPropagation();
            window.downloadFile(filename);
        };
        container.appendChild(downloadButton);
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'media-close';
        closeButton.innerHTML = '✕';
        closeButton.onclick = function(e) {
            e.stopPropagation();
            if (type === 'video' && mediaElement.pause) {
                mediaElement.pause();
            }
            document.body.removeChild(modal);
        };
        container.appendChild(closeButton);
        
        // Add container to modal
        modal.appendChild(container);
        
        // Add click handler to close on background click
        modal.onclick = function(e) {
            if (e.target === modal) {
                if (type === 'video' && mediaElement.pause) {
                    mediaElement.pause();
                }
                document.body.removeChild(modal);
            }
        };
        
        // Add escape key handler
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
        
        // Add modal to body
        document.body.appendChild(modal);
    };
});