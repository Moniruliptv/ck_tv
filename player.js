// player.js - Obiram TV Player Module

const PlayerUI = (function() {
    // Private variables
    let player = null;
    let hls = null;
    let currentChannel = null;
    let currentIndex = 0;
    let isPlayerOpen = false;
    let isMuted = false;
    let currentVolume = 1;
    let aspectMode = 'stretch'; // stretch, fit, zoom
    let qualityMenuVisible = false;
    let settingsMenuVisible = false;
    
    // DOM Elements
    let playerOverlay, playerContainer, videoElement, splashLogo, noSignalImage;
    let playerChannelNumber, playerChannelLogo, playerChannelName;
    let prevBtn, nextBtn, backBtn, settingsBtn;
    let topControlsContainer, customSettingsMenu, qualitySubmenu;
    let favoriteLabel, favoriteItem;
    let qualityValue, aspectValue;
    
    // Callbacks
    let onNextCallback = null;
    let onPrevCallback = null;
    let onCloseCallback = null;
    let onFavoriteToggleCallback = null;
    let onErrorCallback = null;
    
    // Timer for hiding controls
    let controlsTimer = null;
    
    // Initialize the player UI
    function init(containerSelector, playerContainerSelector, overlaySelector) {
        // Get DOM elements
        videoElement = document.querySelector(containerSelector);
        playerContainer = document.querySelector(playerContainerSelector);
        playerOverlay = document.querySelector(overlaySelector);
        
        // Get UI elements
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
        
        // Initialize Plyr
        if (typeof Plyr !== 'undefined') {
            player = new Plyr(videoElement, {
                controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
                settings: ['quality', 'speed'],
                quality: { default: 576, options: [144, 240, 360, 480, 576, 720, 1080] },
                i18n: {
                    quality: 'Quality',
                    speed: 'Speed'
                },
                invertTime: false,
                toggleInvert: false,
                ratio: '16:9',
                fullscreen: { enabled: true, fallback: true, iosNative: true },
                keyboard: { focused: true, global: true },
                tooltips: { controls: true, seek: true },
                displayDuration: true
            });
            
            setupPlayerEvents();
        } else {
            console.error('Plyr library not loaded');
        }
        
        // Setup event listeners for UI
        setupUIEvents();
        
        // Setup settings menu
        setupSettingsMenu();
        
        // Setup quality submenu
        setupQualitySubmenu();
    }
    
    function setupPlayerEvents() {
        if (!player) return;
        
        player.on('ready', () => {
            console.log('Player ready');
            player.volume = currentVolume;
            player.muted = isMuted;
        });
        
        player.on('playing', () => {
            // Hide splash logo when playing
            if (splashLogo) {
                splashLogo.style.opacity = '0';
                setTimeout(() => {
                    splashLogo.style.display = 'none';
                }, 1500);
            }
            
            // Hide no signal if visible
            if (noSignalImage) {
                noSignalImage.style.display = 'none';
            }
            
            playerOverlay.classList.remove('error-active');
        });
        
        player.on('ended', () => {
            // Auto play next channel if enabled
            if (onNextCallback) onNextCallback();
        });
        
        player.on('error', (event) => {
            console.error('Player error:', event.detail);
            if (onErrorCallback) onErrorCallback();
        });
        
        player.on('volumechange', () => {
            currentVolume = player.volume;
            isMuted = player.muted;
        });
    }
    
    function setupUIEvents() {
        // Previous channel button
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onPrevCallback) onPrevCallback();
            });
        }
        
        // Next channel button
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onNextCallback) onNextCallback();
            });
        }
        
        // Back button
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onCloseCallback) onCloseCallback();
            });
        }
        
        // Settings button
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSettingsMenu();
            });
        }
        
        // Favorite item in settings
        if (favoriteItem) {
            favoriteItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onFavoriteToggleCallback) onFavoriteToggleCallback();
                toggleSettingsMenu(false);
            });
        }
        
        // Aspect ratio menu item
        const aspectItem = document.getElementById('menu-item-aspect');
        if (aspectItem) {
            aspectItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                cycleAspectRatio();
            });
        }
        
        // PiP menu item
        const pipItem = document.getElementById('menu-item-pip');
        if (pipItem) {
            pipItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePictureInPicture();
                toggleSettingsMenu(false);
            });
        }
        
        // Quality menu item
        const qualityItem = document.getElementById('menu-item-quality');
        if (qualityItem) {
            qualityItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleQualitySubmenu();
            });
        }
        
        // Player container mouse move (show controls)
        if (playerContainer) {
            playerContainer.addEventListener('mousemove', () => {
                showControls();
                resetControlsTimer();
            });
            
            playerContainer.addEventListener('touchstart', () => {
                showControls();
                resetControlsTimer();
            });
            
            playerContainer.addEventListener('mouseleave', () => {
                if (!settingsMenuVisible && !qualityMenuVisible) {
                    hideControls();
                }
            });
        }
        
        // Click outside to close menus
        document.addEventListener('click', (e) => {
            if (settingsMenuVisible && 
                customSettingsMenu && 
                !customSettingsMenu.contains(e.target) && 
                e.target !== settingsBtn && 
                !settingsBtn.contains(e.target)) {
                toggleSettingsMenu(false);
            }
            
            if (qualityMenuVisible && 
                qualitySubmenu && 
                !qualitySubmenu.contains(e.target) && 
                e.target !== document.getElementById('menu-item-quality')) {
                toggleQualitySubmenu(false);
            }
        });
    }
    
    function setupSettingsMenu() {
        if (!customSettingsMenu) return;
        
        // Add back button functionality if needed
        const backItem = customSettingsMenu.querySelector('.back-item');
        if (backItem) {
            backItem.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle back navigation if in submenu
            });
        }
    }
    
    function setupQualitySubmenu() {
        if (!qualitySubmenu) return;
        
        // Clear existing
        qualitySubmenu.innerHTML = '';
        
        // Create back button
        const backItem = document.createElement('div');
        backItem.className = 'menu-item back-item';
        backItem.innerHTML = `
            <span class="arrow">‹</span>
            <span class="label">Back</span>
        `;
        backItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleQualitySubmenu(false);
        });
        qualitySubmenu.appendChild(backItem);
        
        // Quality options
        const qualities = ['Auto', '1080p', '720p', '480p', '360p', '240p', '144p'];
        
        qualities.forEach(quality => {
            const item = document.createElement('div');
            item.className = 'menu-item';
            if (quality === 'Auto') item.classList.add('active');
            item.innerHTML = `
                <span class="label">${quality}</span>
            `;
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuality(quality);
                toggleQualitySubmenu(false);
            });
            qualitySubmenu.appendChild(item);
        });
    }
    
    function toggleSettingsMenu(show = null) {
        if (!customSettingsMenu) return;
        
        settingsMenuVisible = show !== null ? show : !settingsMenuVisible;
        
        if (settingsMenuVisible) {
            customSettingsMenu.classList.add('visible');
            // Hide quality submenu if visible
            if (qualityMenuVisible) {
                toggleQualitySubmenu(false);
            }
        } else {
            customSettingsMenu.classList.remove('visible');
        }
    }
    
    function toggleQualitySubmenu(show = null) {
        if (!qualitySubmenu) return;
        
        qualityMenuVisible = show !== null ? show : !qualityMenuVisible;
        
        if (qualityMenuVisible) {
            qualitySubmenu.classList.add('visible');
            // Hide main settings menu
            if (settingsMenuVisible) {
                toggleSettingsMenu(false);
            }
        } else {
            qualitySubmenu.classList.remove('visible');
        }
    }
    
    function setQuality(quality) {
        if (!qualityValue) return;
        
        qualityValue.textContent = quality;
        
        // Update active state in submenu
        if (qualitySubmenu) {
            const items = qualitySubmenu.querySelectorAll('.menu-item:not(.back-item)');
            items.forEach(item => {
                if (item.querySelector('.label').textContent === quality) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
        
        // Here you would implement actual quality switching logic
        // This depends on your HLS/DASH implementation
        console.log('Quality changed to:', quality);
    }
    
    function cycleAspectRatio() {
        if (!playerContainer || !aspectValue) return;
        
        const modes = ['stretch', 'fit', 'zoom'];
        const currentIndex = modes.indexOf(aspectMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        aspectMode = modes[nextIndex];
        
        // Update UI
        playerContainer.classList.remove('aspect-stretch', 'aspect-fit', 'aspect-zoom');
        playerContainer.classList.add(`aspect-${aspectMode}`);
        
        // Update text
        let displayText = 'Stretch';
        if (aspectMode === 'fit') displayText = 'Fit';
        if (aspectMode === 'zoom') displayText = 'Zoom';
        aspectValue.textContent = displayText;
    }
    
    function togglePictureInPicture() {
        if (!player || !player.plyr) return;
        
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
        } else {
            player.plyr.fullscreen.enter();
            // Note: Actual PiP requires video element, not Plyr wrapper
            if (videoElement && videoElement.requestPictureInPicture) {
                videoElement.requestPictureInPicture().catch(err => {
                    console.log('PiP error:', err);
                });
            }
        }
    }
    
    function showControls() {
        if (topControlsContainer) {
            topControlsContainer.classList.add('visible');
        }
    }
    
    function hideControls() {
        if (topControlsContainer && !settingsMenuVisible && !qualityMenuVisible) {
            topControlsContainer.classList.remove('visible');
        }
    }
    
    function resetControlsTimer() {
        if (controlsTimer) clearTimeout(controlsTimer);
        
        controlsTimer = setTimeout(() => {
            if (!settingsMenuVisible && !qualityMenuVisible) {
                hideControls();
            }
        }, 3000);
    }
    
    function showErrorMsg() {
        if (playerOverlay && noSignalImage) {
            playerOverlay.classList.add('error-active');
            noSignalImage.style.display = 'block';
            splashLogo.style.display = 'none';
        }
    }
    
    function open(channel, index, keepCurrentState = false) {
        if (!playerOverlay || !videoElement || !player) return;
        
        currentChannel = channel;
        currentIndex = index;
        
        // Reset UI
        playerOverlay.style.display = 'flex';
        playerOverlay.classList.remove('error-active');
        
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
            playerChannelLogo.src = channel.logoUrl || 'https://lh3.googleusercontent.com/d/1iM4PZ4Ra90vtIsfQVlzS3-MKbe07U27q';
        }
        
        if (playerChannelName) {
            playerChannelName.textContent = channel.name || 'Unknown Channel';
        }
        
        // Show controls initially
        showControls();
        resetControlsTimer();
        
        // Load the stream
        loadStream(channel.streamUrl);
        
        isPlayerOpen = true;
    }
    
    function loadStream(url) {
        if (!player || !videoElement) return;
        
        // Stop any existing HLS stream
        if (hls) {
            hls.destroy();
            hls = null;
        }
        
        // Check if it's HLS
        if (url.includes('.m3u8')) {
            if (Hls.isSupported()) {
                hls = new Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                
                hls.loadSource(url);
                hls.attachMedia(videoElement);
                
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    videoElement.play().catch(e => console.log('Autoplay prevented:', e));
                });
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                    console.error('HLS error:', data);
                    if (data.fatal) {
                        switch(data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                hls.startLoad();
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                hls.recoverMediaError();
                                break;
                            default:
                                showErrorMsg();
                                break;
                        }
                    }
                });
            } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                // Native HLS support (Safari)
                videoElement.src = url;
                videoElement.play().catch(e => console.log('Autoplay prevented:', e));
            } else {
                showErrorMsg();
            }
        } else {
            // Regular video stream
            videoElement.src = url;
            videoElement.play().catch(e => console.log('Autoplay prevented:', e));
        }
    }
    
    function close() {
        if (!playerOverlay) return;
        
        // Stop video
        if (player) {
            player.stop();
        }
        
        // Destroy HLS
        if (hls) {
            hls.destroy();
            hls = null;
        }
        
        // Clear video source
        if (videoElement) {
            videoElement.src = '';
            videoElement.load();
        }
        
        // Hide overlay
        playerOverlay.style.display = 'none';
        
        // Hide menus
        toggleSettingsMenu(false);
        toggleQualitySubmenu(false);
        
        // Reset flags
        isPlayerOpen = false;
        currentChannel = null;
        
        // Clear timer
        if (controlsTimer) {
            clearTimeout(controlsTimer);
            controlsTimer = null;
        }
    }
    
    // Public API
    return {
        init: init,
        open: open,
        close: close,
        showErrorMsg: showErrorMsg,
        
        // Callbacks
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
        
        // Player controls
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
        }
    };
})();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerUI;
}
