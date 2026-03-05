// player.js - Obiram TV Player Module (Fully Fixed Version)
// This script works with the main HTML file without any errors

const PlayerUI = (function() {
    // Private variables
    let player = null;
    let hls = null;
    let currentChannel = null;
    let currentIndex = -1;
    let isPlayerOpen = false;
    let isMuted = false;
    let currentVolume = 1;
    let aspectMode = 'stretch'; // stretch, fit, zoom
    let qualityMenuVisible = false;
    let settingsMenuVisible = false;
    
    // DOM Elements - will be set during init
    let videoElement = null;
    let playerContainer = null;
    let playerOverlay = null;
    let splashLogo = null;
    let noSignalImage = null;
    let playerChannelNumber = null;
    let playerChannelLogo = null;
    let playerChannelName = null;
    let prevBtn = null;
    let nextBtn = null;
    let backBtn = null;
    let settingsBtn = null;
    let topControlsContainer = null;
    let customSettingsMenu = null;
    let qualitySubmenu = null;
    let favoriteItem = null;
    let favoriteLabel = null;
    let qualityValue = null;
    let aspectValue = null;
    
    // Callbacks
    let onNextCallback = null;
    let onPrevCallback = null;
    let onCloseCallback = null;
    let onFavoriteToggleCallback = null;
    let onErrorCallback = null;
    
    // Timers
    let controlsTimer = null;
    let reconnectTimer = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 3;
    
    /**
     * Initialize the player UI
     * @param {string} videoSelector - Selector for video element
     * @param {string} containerSelector - Selector for player container
     * @param {string} overlaySelector - Selector for player overlay
     */
    function init(videoSelector, containerSelector, overlaySelector) {
        console.log('PlayerUI: Initializing...');
        
        try {
            // Get main elements
            videoElement = document.querySelector(videoSelector);
            playerContainer = document.querySelector(containerSelector);
            playerOverlay = document.querySelector(overlaySelector);
            
            // Check if elements exist
            if (!videoElement) {
                console.error('PlayerUI: Video element not found with selector:', videoSelector);
                return;
            }
            if (!playerContainer) {
                console.error('PlayerUI: Player container not found with selector:', containerSelector);
                return;
            }
            if (!playerOverlay) {
                console.error('PlayerUI: Player overlay not found with selector:', overlaySelector);
                return;
            }
            
            // Get all UI elements safely
            splashLogo = document.getElementById('splash-logo');
            noSignalImage = document.getElementById('no-signal-image');
            playerChannelNumber = document.getElementById('player-channel-number');
            playerChannelLogo = document.getElementById('player-channel-logo');
            playerChannelName = document.getElementById('player-channel-name');
            prevBtn = document.getElementById('player-prev-btn');
            nextBtn = document.getElementById('player-next-btn');
            backBtn = document.getElementById('player-ui-back-btn');
            settingsBtn = document.getElementById('player-settings-btn');
            topControlsContainer = document.getElementById('player-top-controls-container');
            customSettingsMenu = document.getElementById('custom-settings-menu');
            qualitySubmenu = document.getElementById('quality-submenu');
            favoriteItem = document.getElementById('menu-item-favorites');
            favoriteLabel = document.getElementById('favorite-label');
            qualityValue = document.getElementById('quality-value');
            aspectValue = document.getElementById('aspect-value');
            
            // Log found elements for debugging
            console.log('PlayerUI: Elements loaded successfully');
            
            // Initialize Plyr if available
            initPlyr();
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup menus
            setupMenus();
            
            console.log('PlayerUI: Initialization complete');
            
        } catch (error) {
            console.error('PlayerUI: Initialization error:', error);
        }
    }
    
    /**
     * Initialize Plyr player
     */
    function initPlyr() {
        if (typeof Plyr === 'undefined') {
            console.warn('PlayerUI: Plyr library not loaded, using native controls');
            if (videoElement) {
                videoElement.controls = true;
            }
            return;
        }
        
        try {
            player = new Plyr(videoElement, {
                controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'fullscreen'],
                keyboard: {
                    focused: true,
                    global: true
                },
                tooltips: {
                    controls: true,
                    seek: true
                },
                invertTime: false,
                toggleInvert: false,
                ratio: '16:9',
                fullscreen: {
                    enabled: true,
                    fallback: true,
                    iosNative: true
                },
                storage: {
                    enabled: false // Disable storage to avoid conflicts
                }
            });
            
            // Setup Plyr events
            player.on('ready', onPlayerReady);
            player.on('playing', onPlayerPlaying);
            player.on('ended', onPlayerEnded);
            player.on('error', onPlayerError);
            player.on('volumechange', onPlayerVolumeChange);
            
            console.log('PlayerUI: Plyr initialized successfully');
            
        } catch (error) {
            console.error('PlayerUI: Plyr initialization error:', error);
            if (videoElement) {
                videoElement.controls = true;
            }
        }
    }
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Previous channel button
        if (prevBtn) {
            prevBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('PlayerUI: Previous button clicked');
                if (typeof onPrevCallback === 'function') {
                    onPrevCallback();
                }
            });
        }
        
        // Next channel button
        if (nextBtn) {
            nextBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('PlayerUI: Next button clicked');
                if (typeof onNextCallback === 'function') {
                    onNextCallback();
                }
            });
        }
        
        // Back button
        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('PlayerUI: Back button clicked');
                if (typeof onCloseCallback === 'function') {
                    onCloseCallback();
                }
            });
        }
        
        // Settings button
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleSettingsMenu();
            });
        }
        
        // Favorite menu item
        if (favoriteItem) {
            favoriteItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('PlayerUI: Favorite toggled');
                if (typeof onFavoriteToggleCallback === 'function') {
                    onFavoriteToggleCallback();
                }
                toggleSettingsMenu(false);
            });
        }
        
        // Aspect ratio menu item
        const aspectItem = document.getElementById('menu-item-aspect');
        if (aspectItem) {
            aspectItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                cycleAspectRatio();
            });
        }
        
        // Picture-in-Picture menu item
        const pipItem = document.getElementById('menu-item-pip');
        if (pipItem) {
            pipItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                togglePictureInPicture();
                toggleSettingsMenu(false);
            });
        }
        
        // Quality menu item
        const qualityItem = document.getElementById('menu-item-quality');
        if (qualityItem) {
            qualityItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleQualitySubmenu();
            });
        }
        
        // Mouse move on player container - show controls
        if (playerContainer) {
            playerContainer.addEventListener('mousemove', function() {
                showControls();
                resetControlsTimer();
            });
            
            playerContainer.addEventListener('touchstart', function() {
                showControls();
                resetControlsTimer();
            });
            
            playerContainer.addEventListener('mouseleave', function() {
                if (!settingsMenuVisible && !qualityMenuVisible) {
                    hideControls();
                }
            });
        }
        
        // Click outside to close menus
        document.addEventListener('click', function(e) {
            // Close settings menu if click outside
            if (settingsMenuVisible && customSettingsMenu && 
                !customSettingsMenu.contains(e.target) && 
                e.target !== settingsBtn && 
                (!settingsBtn || !settingsBtn.contains(e.target))) {
                toggleSettingsMenu(false);
            }
            
            // Close quality submenu if click outside
            if (qualityMenuVisible && qualitySubmenu && 
                !qualitySubmenu.contains(e.target) && 
                e.target !== document.getElementById('menu-item-quality')) {
                toggleQualitySubmenu(false);
            }
        });
        
        // Keyboard events for player controls
        document.addEventListener('keydown', function(e) {
            if (!isPlayerOpen) return;
            
            // Ignore if typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ':
                case 'Space':
                    e.preventDefault();
                    if (player) player.togglePlay();
                    break;
                case 'f':
                case 'F':
                    e.preventDefault();
                    if (player) player.fullscreen.toggle();
                    break;
                case 'm':
                case 'M':
                    e.preventDefault();
                    if (player) player.muted = !player.muted;
                    break;
                case 'ArrowLeft':
                    // Previous channel
                    if (typeof onPrevCallback === 'function') {
                        e.preventDefault();
                        onPrevCallback();
                    }
                    break;
                case 'ArrowRight':
                    // Next channel
                    if (typeof onNextCallback === 'function') {
                        e.preventDefault();
                        onNextCallback();
                    }
                    break;
            }
        });
    }
    
    /**
     * Setup settings and quality menus
     */
    function setupMenus() {
        // Setup quality submenu
        if (qualitySubmenu) {
            // Clear existing content
            qualitySubmenu.innerHTML = '';
            
            // Add back button
            const backItem = document.createElement('div');
            backItem.className = 'menu-item back-item';
            backItem.innerHTML = '<span class="arrow">‹</span><span class="label">Back</span>';
            backItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleQualitySubmenu(false);
            });
            qualitySubmenu.appendChild(backItem);
            
            // Add quality options
            const qualities = ['Auto', '1080p', '720p', '480p', '360p', '240p'];
            qualities.forEach(function(quality) {
                const item = document.createElement('div');
                item.className = 'menu-item';
                if (quality === 'Auto') item.classList.add('active');
                item.innerHTML = `<span class="label">${quality}</span>`;
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    setQuality(quality);
                    toggleQualitySubmenu(false);
                });
                qualitySubmenu.appendChild(item);
            });
        }
        
        // Set initial aspect ratio display
        if (aspectValue) {
            aspectValue.textContent = 'Stretch';
        }
        
        // Set initial quality display
        if (qualityValue) {
            qualityValue.textContent = 'Auto';
        }
    }
    
    /**
     * Player event handlers
     */
    function onPlayerReady() {
        console.log('PlayerUI: Player ready');
        if (player) {
            player.volume = currentVolume;
            player.muted = isMuted;
        }
    }
    
    function onPlayerPlaying() {
        console.log('PlayerUI: Video playing');
        
        // Hide splash logo
        if (splashLogo) {
            splashLogo.style.opacity = '0';
            setTimeout(function() {
                if (splashLogo) splashLogo.style.display = 'none';
            }, 1500);
        }
        
        // Hide no signal
        if (noSignalImage) {
            noSignalImage.style.display = 'none';
        }
        
        // Remove error class
        if (playerOverlay) {
            playerOverlay.classList.remove('error-active');
        }
        
        // Reset reconnect attempts
        reconnectAttempts = 0;
    }
    
    function onPlayerEnded() {
        console.log('PlayerUI: Video ended');
        if (typeof onNextCallback === 'function') {
            onNextCallback();
        }
    }
    
    function onPlayerError(event) {
        console.error('PlayerUI: Player error:', event);
        handleStreamError();
    }
    
    function onPlayerVolumeChange() {
        if (player) {
            currentVolume = player.volume;
            isMuted = player.muted;
        }
    }
    
    /**
     * Handle stream errors with reconnection logic
     */
    function handleStreamError() {
        console.log('PlayerUI: Stream error, attempt:', reconnectAttempts + 1);
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            showControls();
            
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(function() {
                if (typeof onErrorCallback === 'function') {
                    onErrorCallback();
                }
            }, 2000);
        } else {
            showErrorMsg();
        }
    }
    
    /**
     * Toggle settings menu visibility
     */
    function toggleSettingsMenu(show) {
        if (!customSettingsMenu) return;
        
        settingsMenuVisible = (show !== undefined) ? show : !settingsMenuVisible;
        
        if (settingsMenuVisible) {
            customSettingsMenu.classList.add('visible');
            if (qualityMenuVisible) toggleQualitySubmenu(false);
        } else {
            customSettingsMenu.classList.remove('visible');
        }
    }
    
    /**
     * Toggle quality submenu visibility
     */
    function toggleQualitySubmenu(show) {
        if (!qualitySubmenu) return;
        
        qualityMenuVisible = (show !== undefined) ? show : !qualityMenuVisible;
        
        if (qualityMenuVisible) {
            qualitySubmenu.classList.add('visible');
            if (settingsMenuVisible) toggleSettingsMenu(false);
        } else {
            qualitySubmenu.classList.remove('visible');
        }
    }
    
    /**
     * Set video quality
     */
    function setQuality(quality) {
        if (qualityValue) {
            qualityValue.textContent = quality;
        }
        
        // Update active state in submenu
        if (qualitySubmenu) {
            const items = qualitySubmenu.querySelectorAll('.menu-item:not(.back-item)');
            items.forEach(function(item) {
                const label = item.querySelector('.label');
                if (label && label.textContent === quality) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
        
        // Actual quality switching logic for HLS
        if (hls) {
            if (quality === 'Auto') {
                hls.currentLevel = -1;
            } else {
                const height = parseInt(quality);
                if (!isNaN(height)) {
                    const levels = hls.levels;
                    for (let i = 0; i < levels.length; i++) {
                        if (levels[i].height >= height) {
                            hls.currentLevel = i;
                            break;
                        }
                    }
                }
            }
        }
        
        console.log('PlayerUI: Quality set to', quality);
    }
    
    /**
     * Cycle through aspect ratio modes
     */
    function cycleAspectRatio() {
        if (!playerContainer || !aspectValue) return;
        
        const modes = ['stretch', 'fit', 'zoom'];
        const currentIndex = modes.indexOf(aspectMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        aspectMode = modes[nextIndex];
        
        // Remove all aspect classes
        playerContainer.classList.remove('aspect-fit', 'aspect-stretch', 'aspect-zoom');
        
        // Add new class
        playerContainer.classList.add(`aspect-${aspectMode}`);
        
        // Update display
        let displayText = 'Stretch';
        if (aspectMode === 'fit') displayText = 'Fit';
        if (aspectMode === 'zoom') displayText = 'Zoom';
        aspectValue.textContent = displayText;
        
        console.log('PlayerUI: Aspect ratio set to', displayText);
    }
    
    /**
     * Toggle Picture-in-Picture mode
     */
    function togglePictureInPicture() {
        if (!videoElement) return;
        
        try {
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture()
                    .catch(function(err) {
                        console.log('PlayerUI: Exit PiP error:', err);
                    });
            } else if (videoElement.requestPictureInPicture) {
                videoElement.requestPictureInPicture()
                    .catch(function(err) {
                        console.log('PlayerUI: Enter PiP error:', err);
                    });
            } else {
                // Fallback to fullscreen
                if (player && player.fullscreen) {
                    player.fullscreen.toggle();
                }
            }
        } catch (error) {
            console.error('PlayerUI: PiP error:', error);
        }
    }
    
    /**
     * Show player controls
     */
    function showControls() {
        if (topControlsContainer) {
            topControlsContainer.classList.add('visible');
        }
    }
    
    /**
     * Hide player controls
     */
    function hideControls() {
        if (topControlsContainer && !settingsMenuVisible && !qualityMenuVisible) {
            topControlsContainer.classList.remove('visible');
        }
    }
    
    /**
     * Reset the auto-hide timer for controls
     */
    function resetControlsTimer() {
        if (controlsTimer) {
            clearTimeout(controlsTimer);
        }
        
        controlsTimer = setTimeout(function() {
            if (!settingsMenuVisible && !qualityMenuVisible) {
                hideControls();
            }
        }, 3000);
    }
    
    /**
     * Show error message (no signal)
     */
    function showErrorMsg() {
        console.log('PlayerUI: Showing error message');
        
        if (playerOverlay) {
            playerOverlay.classList.add('error-active');
        }
        
        if (noSignalImage) {
            noSignalImage.style.display = 'block';
        }
        
        if (splashLogo) {
            splashLogo.style.display = 'none';
        }
    }
    
    /**
     * Open player with a channel
     */
    function open(channel, index, keepState) {
        if (!playerOverlay || !videoElement) {
            console.error('PlayerUI: Cannot open player - elements not ready');
            return;
        }
        
        console.log('PlayerUI: Opening channel:', channel ? channel.name : 'Unknown');
        
        currentChannel = channel || { name: 'Unknown', logoUrl: '', streamUrl: '' };
        currentIndex = index !== undefined ? index : -1;
        
        // Reset state
        playerOverlay.style.display = 'flex';
        playerOverlay.classList.remove('error-active');
        reconnectAttempts = 0;
        
        // Show splash logo
        if (splashLogo) {
            splashLogo.style.display = 'block';
            splashLogo.style.opacity = '1';
        }
        
        // Hide no signal
        if (noSignalImage) {
            noSignalImage.style.display = 'none';
        }
        
        // Update channel info
        if (playerChannelNumber) {
            playerChannelNumber.textContent = (index + 1).toString().padStart(2, '0');
        }
        
        if (playerChannelLogo) {
            playerChannelLogo.src = currentChannel.logoUrl || 'https://lh3.googleusercontent.com/d/1iM4PZ4Ra90vtIsfQVlzS3-MKbe07U27q';
        }
        
        if (playerChannelName) {
            playerChannelName.textContent = currentChannel.name || 'Unknown Channel';
        }
        
        // Show controls
        showControls();
        resetControlsTimer();
        
        // Load the stream
        loadStream(currentChannel.streamUrl);
        
        isPlayerOpen = true;
    }
    
    /**
     * Load a stream URL
     */
    function loadStream(url) {
        if (!videoElement) return;
        
        console.log('PlayerUI: Loading stream:', url);
        
        // Clean up existing HLS instance
        if (hls) {
            try {
                hls.destroy();
            } catch (e) {
                console.warn('PlayerUI: Error destroying HLS:', e);
            }
            hls = null;
        }
        
        // Clear video source
        videoElement.src = '';
        videoElement.load();
        
        // Check if URL is valid
        if (!url || url === '') {
            console.error('PlayerUI: Invalid stream URL');
            showErrorMsg();
            return;
        }
        
        // Handle different stream types
        if (url.includes('.m3u8')) {
            // HLS stream
            if (Hls && Hls.isSupported()) {
                try {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        maxBufferLength: 30,
                        maxMaxBufferLength: 60,
                        liveSyncDuration: 3,
                        liveMaxLatencyDuration: 10
                    });
                    
                    hls.loadSource(url);
                    hls.attachMedia(videoElement);
                    
                    hls.on(Hls.Events.MANIFEST_PARSED, function() {
                        console.log('PlayerUI: HLS manifest parsed');
                        videoElement.play()
                            .then(function() {
                                console.log('PlayerUI: Playing HLS stream');
                            })
                            .catch(function(e) {
                                console.log('PlayerUI: Autoplay prevented:', e);
                            });
                    });
                    
                    hls.on(Hls.Events.ERROR, function(event, data) {
                        console.error('PlayerUI: HLS error:', data);
                        
                        if (data.fatal) {
                            switch(data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    console.log('PlayerUI: Network error, retrying...');
                                    hls.startLoad();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    console.log('PlayerUI: Media error, recovering...');
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    handleStreamError();
                                    break;
                            }
                        }
                    });
                    
                } catch (error) {
                    console.error('PlayerUI: HLS initialization error:', error);
                    showErrorMsg();
                }
                
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS (Safari)
                videoElement.src = url;
                videoElement.play()
                    .catch(function(e) {
                        console.log('PlayerUI: Autoplay prevented:', e);
                    });
            } else {
                console.error('PlayerUI: HLS not supported');
                showErrorMsg();
            }
        } else {
            // Direct video stream (MP4, etc)
            videoElement.src = url;
            videoElement.play()
                .then(function() {
                    console.log('PlayerUI: Playing direct stream');
                })
                .catch(function(e) {
                    console.log('PlayerUI: Autoplay prevented:', e);
                });
        }
    }
    
    /**
     * Close the player
     */
    function close() {
        console.log('PlayerUI: Closing player');
        
        // Stop Plyr
        if (player) {
            try {
                player.stop();
            } catch (e) {
                console.warn('PlayerUI: Error stopping player:', e);
            }
        }
        
        // Destroy HLS
        if (hls) {
            try {
                hls.destroy();
            } catch (e) {
                console.warn('PlayerUI: Error destroying HLS:', e);
            }
            hls = null;
        }
        
        // Clear video source
        if (videoElement) {
            videoElement.src = '';
            videoElement.load();
        }
        
        // Hide overlay
        if (playerOverlay) {
            playerOverlay.style.display = 'none';
        }
        
        // Hide menus
        toggleSettingsMenu(false);
        toggleQualitySubmenu(false);
        
        // Reset state
        isPlayerOpen = false;
        currentChannel = null;
        currentIndex = -1;
        
        // Clear timers
        if (controlsTimer) {
            clearTimeout(controlsTimer);
            controlsTimer = null;
        }
        
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    }
    
    /**
     * Update favorite button state
     */
    function updateFavoriteButton(isFavorite) {
        if (favoriteLabel) {
            favoriteLabel.textContent = isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
        }
        if (favoriteItem) {
            if (isFavorite) {
                favoriteItem.classList.add('active');
            } else {
                favoriteItem.classList.remove('active');
            }
        }
    }
    
    // Public API
    return {
        // Initialize the player
        init: init,
        
        // Open a channel
        open: open,
        
        // Close the player
        close: close,
        
        // Show error message
        showErrorMsg: showErrorMsg,
        
        // Update favorite button
        updateFavoriteButton: updateFavoriteButton,
        
        // Callback setters
        set onNext(callback) {
            onNextCallback = callback;
        },
        
        set onPrev(callback) {
            onPrevCallback = callback;
        },
        
        set onClose(callback) {
            onCloseCallback = callback;
        },
        
        set onFavoriteToggle(callback) {
            onFavoriteToggleCallback = callback;
        },
        
        set onError(callback) {
            onErrorCallback = callback;
        },
        
        // Getters
        get plyr() {
            return player;
        },
        
        get hls() {
            return hls;
        },
        
        get isOpen() {
            return isPlayerOpen;
        },
        
        get currentChannel() {
            return currentChannel;
        },
        
        get currentIndex() {
            return currentIndex;
        }
    };
})();

// Export for module environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerUI;
}

// Make globally available
window.PlayerUI = PlayerUI;

console.log('PlayerUI: Script loaded and ready');