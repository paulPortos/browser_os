/**
 * Main Application Entry Point
 * Initializes BrowserOS and all its components
 */
class BrowserOS {
    constructor() {
        this.initialized = false;
        this.version = '1.0.0';
        this.startTime = Date.now();
        
        this.init();
    }

    async init() {
        try {
            console.log('🖥️ BrowserOS v' + this.version + ' - Starting up...');
            
            // Show loading screen
            this.showBootScreen();
            
            // Initialize core systems
            await this.initializeCoreComponents();
            
            // Start system services
            this.startSystemServices();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Mark as initialized
            this.initialized = true;
            
            // Hide loading screen
            setTimeout(() => {
                this.hideBootScreen();
                this.showWelcomeMessage();
            }, 2000);
            
            console.log('✅ BrowserOS initialized successfully in ' + (Date.now() - this.startTime) + 'ms');
            
        } catch (error) {
            console.error('❌ Failed to initialize BrowserOS:', error);
            
            // Use error reporter if available
            if (window.errorReporter) {
                window.errorReporter.reportManualError(error, {
                    phase: 'System Initialization',
                    component: 'BrowserOS',
                    action: 'init'
                });
            } else {
                // Fallback error display
                this.showFallbackError(error);
            }
        }
    }

    showBootScreen() {
        const bootScreen = document.createElement('div');
        bootScreen.id = 'boot-screen';
        bootScreen.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                z-index: 9999;
            ">
                <div style="font-size: 80px; margin-bottom: 20px;">🖥️</div>
                <h1 style="font-size: 48px; font-weight: 300; margin-bottom: 16px;">BrowserOS</h1>
                <div style="font-size: 18px; opacity: 0.8; margin-bottom: 40px;">Starting up...</div>
                
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
                    <div style="width: 0%; height: 100%; background: white; border-radius: 2px; animation: bootProgress 2s ease-in-out forwards;"></div>
                </div>
                
                <div style="margin-top: 20px; font-size: 14px; opacity: 0.6;">Version ${this.version}</div>
            </div>
            
            <style>
                @keyframes bootProgress {
                    0% { width: 0%; }
                    20% { width: 30%; }
                    50% { width: 60%; }
                    80% { width: 90%; }
                    100% { width: 100%; }
                }
            </style>
        `;
        
        document.body.appendChild(bootScreen);
    }

    hideBootScreen() {
        const bootScreen = document.getElementById('boot-screen');
        if (bootScreen) {
            bootScreen.style.opacity = '0';
            bootScreen.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                bootScreen.remove();
            }, 500);
        }
    }

    async initializeCoreComponents() {
        // Initialize ConfigManager first
        if (window.ConfigManager) {
            window.configManager = new ConfigManager();
            console.log('✅ ConfigManager initialized');
        }
        
        // Core components are already initialized via script loading
        // This method can be used for async initialization if needed
        
        // Simulate loading time and wait for all components
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Verify all core components are loaded
        const requiredComponents = [
            'eventManager',
            'windowManager', 
            'systemUtils',
            'menuBar',
            'dock',
            'desktop'
        ];
        
        for (const component of requiredComponents) {
            if (!window[component]) {
                console.error(`❌ Required component ${component} not found`);
                throw new Error(`Required component ${component} not found`);
            } else {
                console.log(`✅ Component ${component} loaded successfully`);
            }
        }
        
        // Wait a bit more for apps to finish initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify all applications are loaded
        const requiredApps = [
            'finderApp',
            'terminalApp', 
            'textEditorApp',
            'calculatorApp',
            'browserApp',
            'settingsApp'
        ];
        
        let missingApps = [];
        for (const app of requiredApps) {
            if (!window[app]) {
                console.error(`❌ Required application ${app} not found`);
                missingApps.push(app);
            } else {
                console.log(`✅ Application ${app} loaded successfully`);
            }
        }
        
        if (missingApps.length > 0) {
            console.log('Available apps:', Object.keys(window).filter(key => key.endsWith('App')));
            throw new Error(`Required applications not found: ${missingApps.join(', ')}`);
        }
        
        // Apply saved configuration
        if (window.configManager) {
            try {
                const config = window.configManager.loadConfig();
                const settings = window.configManager.getSettings();
                
                if (settings && settings.theme) {
                    window.configManager.applyTheme(settings.theme);
                    console.log('✅ Configuration applied:', settings);
                } else {
                    console.log('⚠️ No saved settings found, using defaults');
                    // Apply default theme
                    window.configManager.applyTheme('light');
                }
            } catch (error) {
                console.error('❌ Failed to apply configuration:', error);
                // Apply default theme as fallback
                if (window.configManager.applyTheme) {
                    window.configManager.applyTheme('light');
                }
            }
        } else {
            console.log('⚠️ ConfigManager not available');
        }
    }

    startSystemServices() {
        // Start system clock
        SystemUtils.startSystemClock();
        
        // Start battery monitor
        SystemUtils.startBatteryMonitor();
        
        // Setup auto-save for applications (every 5 minutes)
        setInterval(() => {
            eventManager.emit('system:autosave');
        }, 5 * 60 * 1000);
        
        // Setup system cleanup (every hour)
        setInterval(() => {
            this.performSystemCleanup();
        }, 60 * 60 * 1000);
    }

    setupGlobalEventListeners() {
        // Prevent context menu on the body (but allow it on specific elements)
        document.body.addEventListener('contextmenu', (e) => {
            if (e.target === document.body) {
                e.preventDefault();
            }
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Skip if event is from input elements to avoid interference
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.isContentEditable) {
                return;
            }
            
            this.handleGlobalKeyboard(e);
        });
        
        // Handle window resize
        window.addEventListener('resize', SystemUtils.debounce(() => {
            eventManager.emit('system:resize');
        }, 250));
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            SystemUtils.showNotification('Network', 'Connection restored');
            eventManager.emit('network:online');
        });
        
        window.addEventListener('offline', () => {
            SystemUtils.showNotification('Network', 'Connection lost', 5000);
            eventManager.emit('network:offline');
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                eventManager.emit('system:background');
            } else {
                eventManager.emit('system:foreground');
            }
        });
        
        // Handle before unload (warn about unsaved changes)
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        });
    }

    handleGlobalKeyboard(event) {
        const { key, ctrlKey, metaKey, altKey, shiftKey } = event;
        const cmdKey = ctrlKey || metaKey;
        
        // System-wide shortcuts
        if (cmdKey) {
            switch (key.toLowerCase()) {
                case 'space':
                    // Spotlight search (future implementation)
                    event.preventDefault();
                    this.showSpotlight();
                    break;
                    
                case 'tab':
                    // Application switcher (future implementation)
                    event.preventDefault();
                    this.showAppSwitcher();
                    break;
                    
                case 'q':
                    // Quit active application
                    const activeWindow = windowManager.getActiveWindow();
                    if (activeWindow) {
                        event.preventDefault();
                        windowManager.closeWindow(activeWindow.id);
                    }
                    break;
                    
                case 'w':
                    // Close active window
                    const currentWindow = windowManager.getActiveWindow();
                    if (currentWindow) {
                        event.preventDefault();
                        windowManager.closeWindow(currentWindow.id);
                    }
                    break;
                    
                case 'm':
                    // Minimize active window
                    const windowToMinimize = windowManager.getActiveWindow();
                    if (windowToMinimize) {
                        event.preventDefault();
                        windowManager.minimizeWindow(windowToMinimize.id);
                    }
                    break;
            }
        }
        
        // Function keys
        switch (key) {
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
                
            case 'F12':
                // Toggle developer tools (in real browser)
                break;
        }
        
        // Emergency reset
        if (cmdKey && altKey && key === 'r') {
            event.preventDefault();
            this.emergencyReset();
        }
    }

    showSpotlight() {
        // Future implementation: search interface
        SystemUtils.showModal(
            'Spotlight Search',
            `
                <div style="margin: 16px 0;">
                    <input type="text" placeholder="Search applications, files, and more..." 
                           style="width: 100%; padding: 12px; font-size: 16px; border: 1px solid #ddd; border-radius: 8px;" 
                           autofocus>
                </div>
                <div style="margin-top: 16px; color: #666; font-size: 12px;">
                    Search functionality coming soon...
                </div>
            `,
            [{ text: 'Cancel', primary: true }]
        );
    }

    showAppSwitcher() {
        // Future implementation: application switcher
        const openWindows = Array.from(windowManager.windows.values());
        if (openWindows.length === 0) {
            SystemUtils.showNotification('System', 'No applications are currently running');
            return;
        }
        
        SystemUtils.showModal(
            'Application Switcher',
            `
                <div style="margin: 16px 0;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 16px;">
                        ${openWindows.map(window => `
                            <div style="text-align: center; padding: 16px; border: 1px solid #ddd; border-radius: 8px; cursor: pointer;"
                                 onclick="windowManager.focusWindow('${window.id}'); document.querySelector('.modal-overlay').click();">
                                <div style="font-size: 32px; margin-bottom: 8px;">📱</div>
                                <div style="font-size: 12px;">${window.title}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `,
            [{ text: 'Cancel', primary: true }]
        );
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                SystemUtils.showNotification('System', 'Could not enter fullscreen mode');
            });
        } else {
            document.exitFullscreen();
        }
    }

    emergencyReset() {
        SystemUtils.showModal(
            'Emergency Reset',
            'This will close all applications and restart BrowserOS. Continue?',
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Reset', primary: true, value: 'reset' }
            ]
        ).then(result => {
            if (result === 'reset') {
                location.reload();
            }
        });
    }

    performSystemCleanup() {
        // Clean up unused resources, memory, etc.
        console.log('🧹 Performing system cleanup...');
        
        // Clear old notifications
        document.querySelectorAll('.notification').forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        // Clear old context menus
        document.querySelectorAll('.context-menu').forEach(menu => {
            menu.remove();
        });
        
        // Emit cleanup event for applications to handle their own cleanup
        eventManager.emit('system:cleanup');
    }

    hasUnsavedChanges() {
        // Check if any applications have unsaved changes
        // This is a simple implementation - real apps would register their state
        return false;
    }

    showWelcomeMessage() {
        // Show welcome notification
        SystemUtils.showNotification(
            'Welcome to BrowserOS!',
            'Your desktop environment is ready. Click on applications in the dock to get started.',
            5000
        );
        
        // Emit system ready event
        eventManager.emit('system:ready');
    }

    showErrorMessage(message) {
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #ff6b6b;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="font-size: 80px; margin-bottom: 20px;">⚠️</div>
                <h1 style="font-size: 36px; font-weight: 300; margin-bottom: 16px;">System Error</h1>
                <div style="font-size: 18px; opacity: 0.9; max-width: 600px;">${message}</div>
                <button onclick="location.reload()" style="
                    margin-top: 30px;
                    padding: 12px 24px;
                    font-size: 16px;
                    background: white;
                    color: #ff6b6b;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Restart System</button>
            </div>
        `;
    }

    showFallbackError(error) {
        document.body.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: #ff6b6b;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                text-align: center;
                padding: 20px;
            ">
                <div style="font-size: 80px; margin-bottom: 20px;">💥</div>
                <h1 style="font-size: 36px; font-weight: 300; margin-bottom: 16px;">Critical System Error</h1>
                <div style="font-size: 18px; opacity: 0.9; max-width: 600px; margin-bottom: 20px;">
                    ${error.message || 'An unexpected error occurred during system initialization.'}
                </div>
                <div style="
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 16px;
                    margin: 20px 0;
                    font-family: 'Courier New', monospace;
                    font-size: 14px;
                    text-align: left;
                    max-width: 80%;
                    overflow-x: auto;
                ">
                    ${error.stack ? error.stack.replace(/\n/g, '<br>') : error.toString()}
                </div>
                <div style="display: flex; gap: 12px;">
                    <button onclick="location.reload()" style="
                        padding: 12px 24px;
                        font-size: 16px;
                        background: white;
                        color: #ff6b6b;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Restart System</button>
                    <button onclick="window.reportError && window.reportError('${error.message?.replace(/'/g, "\\'")}', '${error.stack?.replace(/'/g, "\\'")}')" style="
                        padding: 12px 24px;
                        font-size: 16px;
                        background: #34C759;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Report Problem</button>
                </div>
            </div>
        `;
        
        // Add global report function for fallback error
        window.reportError = (message, stack) => {
            const errorData = {
                message: message,
                stack: stack,
                type: 'Critical System Error',
                timestamp: new Date().toISOString()
            };
            
            if (window.errorReporter) {
                window.errorReporter.downloadErrorReport(errorData);
            } else {
                // Manual email reporting
                const subject = encodeURIComponent('BrowserOS Critical Error Report');
                const body = encodeURIComponent(`Error: ${message}\n\nStack Trace:\n${stack}\n\nTimestamp: ${new Date().toISOString()}`);
                window.open(`mailto:your-email@gmail.com?subject=${subject}&body=${body}`);
            }
        };
    }

    // Public API methods
    getSystemInfo() {
        return {
            name: 'BrowserOS',
            version: this.version,
            initialized: this.initialized,
            uptime: Date.now() - this.startTime,
            windows: windowManager.windows.size,
            ...SystemUtils.getSystemInfo()
        };
    }

    shutdown() {
        SystemUtils.showModal(
            'Shut Down',
            'Are you sure you want to shut down BrowserOS?',
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Shut Down', primary: true, value: 'shutdown' }
            ]
        ).then(result => {
            if (result === 'shutdown') {
                // Close all windows
                windowManager.windows.forEach((windowData) => {
                    windowManager.closeWindow(windowData.id);
                });
                
                // Show shutdown screen
                document.body.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: #000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    ">
                        <div style="text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 20px;">💤</div>
                            <div style="font-size: 24px;">BrowserOS has shut down</div>
                        </div>
                    </div>
                `;
                
                // Try to close the window after a delay
                setTimeout(() => {
                    window.close();
                }, 2000);
            }
        });
    }
}

// Initialize BrowserOS when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.browserOS = new BrowserOS();
});

// Make BrowserOS globally accessible
window.BrowserOS = BrowserOS;
