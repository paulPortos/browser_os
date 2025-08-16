/**
 * Settings Application - System preferences and configuration
 */
class SettingsApp {
    constructor() {
        this.appId = 'settings';
        this.windows = new Map();
        this.currentSettings = {};
        this.initRetryCount = 0;
        this.maxRetries = 10;
        
        this.init();
    }

    init() {
        // Listen for app launch events
        if (window.eventManager) {
            eventManager.on('app:launch', (data) => {
                if (data.appId === this.appId) {
                    this.launch(data);
                }
            });
            
            console.log('✅ SettingsApp initialized successfully');
        } else if (this.initRetryCount < this.maxRetries) {
            // Retry initialization after a short delay
            this.initRetryCount++;
            console.log(`⏳ SettingsApp waiting for eventManager (attempt ${this.initRetryCount}/${this.maxRetries})`);
            setTimeout(() => {
                this.init();
            }, 100);
            return;
        } else {
            console.error('❌ SettingsApp failed to initialize: eventManager not available after max retries');
            return;
        }

        // Load current settings when available
        if (window.configManager) {
            this.currentSettings = window.configManager.getSettings();
        }
    }

    launch(options = {}) {
        // Get current settings
        const settings = window.configManager ? window.configManager.getSettings() : {};
        const currentTheme = settings.theme || 'light';
        const systemName = settings.systemName || 'BrowserOS';
        
        const content = `
            <div class="settings-container" style="height: 100%; display: flex; background: var(--bg-primary);">
                <div class="settings-sidebar" style="width: 200px; background: var(--bg-secondary); border-right: 1px solid var(--border-color); padding: 16px;">
                    <div style="font-weight: bold; margin-bottom: 16px; color: var(--text-primary);">System Preferences</div>
                    <div class="settings-nav-item active" data-section="general" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; background: var(--accent-color); color: white;">General</div>
                    <div class="settings-nav-item" data-section="desktop" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: var(--text-primary);">Desktop & Dock</div>
                    <div class="settings-nav-item" data-section="displays" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: var(--text-primary);">Displays</div>
                    <div class="settings-nav-item" data-section="sound" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: var(--text-primary);">Sound</div>
                    <div class="settings-nav-item" data-section="network" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: var(--text-primary);">Network</div>
                    <div class="settings-nav-item" data-section="security" style="padding: 8px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; color: var(--text-primary);">Security</div>
                </div>
                <div class="settings-content" style="flex: 1; padding: 24px; background: var(--bg-primary);">
                    <div class="settings-section" data-section="general">
                        <h2 style="margin-bottom: 20px; color: var(--text-primary);">General</h2>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">System Name:</label>
                            <input id="system-name" type="text" value="${systemName}" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 250px; background: var(--bg-primary); color: var(--text-primary);">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Theme:</label>
                            <select id="theme-select" style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 150px; background: var(--bg-primary); color: var(--text-primary);">
                                <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                                <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                                <option value="auto" ${currentTheme === 'auto' ? 'selected' : ''}>Auto</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                                <input id="show-desktop-icons" type="checkbox" ${settings.showDesktopIcons !== false ? 'checked' : ''}> Show desktop icons
                            </label>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                                <input id="enable-animations" type="checkbox" ${settings.enableAnimations !== false ? 'checked' : ''}> Enable animations
                            </label>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                                <input id="auto-hide-dock" type="checkbox" ${settings.autoHideDock ? 'checked' : ''}> Auto-hide dock
                            </label>
                        </div>
                        <hr style="border: none; height: 1px; background: var(--border-color); margin: 24px 0;">
                        <h3 style="margin-bottom: 16px; color: var(--text-primary);">Error Reporting</h3>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-primary);">Developer Email:</label>
                            <input id="developer-email" type="email" value="${window.envConfig ? window.envConfig.get('DEVELOPMENT_EMAIL') : 'developer@yourdomain.com'}" 
                                   style="padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; width: 300px; background: var(--bg-primary); color: var(--text-primary);"
                                   placeholder="your-email@domain.com">
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">
                                Error reports will be sent to this email address when users click "Report Problem"
                            </div>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary);">
                                <input id="enable-error-reporting" type="checkbox" ${window.envConfig ? window.envConfig.get('ENABLE_ERROR_REPORTING') : true} checked> Enable error reporting
                            </label>
                        </div>
                        <div style="margin-bottom: 16px;">
                            <button id="test-error-reporting" style="padding: 8px 16px; background: #FF9500; color: white; border: none; border-radius: 4px; cursor: pointer;">Test Error Reporting</button>
                        </div>
                        <button id="apply-settings" style="padding: 10px 20px; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">Apply Settings</button>
                        <button id="reset-settings" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px; margin-left: 10px;">Reset to Defaults</button>
                    </div>
                    <div class="settings-section hidden" data-section="desktop" style="display: none;">
                        <h2 style="margin-bottom: 20px; color: var(--text-primary);">Desktop & Dock</h2>
                        <p style="color: var(--text-secondary);">Desktop and Dock preferences coming soon...</p>
                    </div>
                    <div class="settings-section hidden" data-section="displays" style="display: none;">
                        <h2 style="margin-bottom: 20px; color: var(--text-primary);">Displays</h2>
                        <p style="color: var(--text-secondary);">Display preferences coming soon...</p>
                    </div>
                    <div class="settings-section hidden" data-section="sound" style="display: none;">
                        <h2 style="margin-bottom: 20px; color: var(--text-primary);">Sound</h2>
                        <p style="color: var(--text-secondary);">Sound preferences coming soon...</p>
                    </div>
                    <div class="settings-section hidden" data-section="network" style="display: none;">
                        <h2 style="margin-bottom: 20px; color: var(--text-primary);">Network</h2>
                        <p style="color: var(--text-secondary);">Network preferences coming soon...</p>
                    </div>
                    <div class="settings-section hidden" data-section="security" style="display: none;">
                        <h2 style="margin-bottom: 20px; color: var(--text-primary);">Security</h2>
                        <p style="color: var(--text-secondary);">Security preferences coming soon...</p>
                    </div>
                </div>
            </div>
        `;
        
        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'System Preferences',
            content,
            {
                width: 800,
                height: 600,
                ...options
            }
        );

        // Store window reference
        this.windows.set(windowId, {
            windowId,
            element: windowManager.getWindow(windowId).element
        });

        // Setup event listeners
        this.setupEventListeners(windowId);

        return windowId;
    }

    /**
     * Setup event listeners for settings window
     */
    setupEventListeners(windowId) {
        const windowElement = this.windows.get(windowId).element;
        
        // Navigation
        const navItems = windowElement.querySelectorAll('.settings-nav-item');
        const sections = windowElement.querySelectorAll('.settings-section');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetSection = item.dataset.section;
                
                // Update active nav item
                navItems.forEach(nav => {
                    nav.classList.remove('active');
                    nav.style.background = 'transparent';
                });
                item.classList.add('active');
                item.style.background = 'var(--accent-color)';
                
                // Show target section
                sections.forEach(section => {
                    if (section.dataset.section === targetSection) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });

        // Theme change
        const themeSelect = windowElement.querySelector('#theme-select');
        themeSelect.addEventListener('change', (e) => {
            this.changeTheme(e.target.value);
        });

        // Apply settings button
        const applyBtn = windowElement.querySelector('#apply-settings');
        applyBtn.addEventListener('click', () => {
            this.applySettings(windowId);
        });

        // Reset settings button
        const resetBtn = windowElement.querySelector('#reset-settings');
        resetBtn.addEventListener('click', () => {
            this.resetSettings(windowId);
        });

        // Test error reporting button
        const testErrorBtn = windowElement.querySelector('#test-error-reporting');
        testErrorBtn.addEventListener('click', () => {
            this.testErrorReporting();
        });
    }

    /**
     * Change theme immediately
     */
    changeTheme(theme) {
        if (!window.configManager) return;
        
        // Update settings
        const settings = window.configManager.getSettings();
        settings.theme = theme;
        window.configManager.updateSettings(settings);
        
        // Apply theme immediately
        window.configManager.applyTheme(theme);
        
        // Show feedback
        this.showNotification('Theme changed successfully');
    }

    /**
     * Apply all settings
     */
    applySettings(windowId) {
        if (!window.configManager) {
            this.showNotification('Configuration manager not available', 'error');
            return;
        }
        
        const windowElement = this.windows.get(windowId).element;
        
        // Collect all settings
        const newSettings = {
            systemName: windowElement.querySelector('#system-name').value,
            theme: windowElement.querySelector('#theme-select').value,
            showDesktopIcons: windowElement.querySelector('#show-desktop-icons').checked,
            enableAnimations: windowElement.querySelector('#enable-animations').checked,
            autoHideDock: windowElement.querySelector('#auto-hide-dock').checked
        };
        
        // Update settings
        window.configManager.updateSettings(newSettings);
        
        // Update error reporting configuration
        const developerEmail = windowElement.querySelector('#developer-email').value;
        const enableErrorReporting = windowElement.querySelector('#enable-error-reporting').checked;
        
        if (window.envConfig) {
            window.envConfig.set('DEVELOPMENT_EMAIL', developerEmail);
            window.envConfig.set('ENABLE_ERROR_REPORTING', enableErrorReporting);
        }
        
        // Apply theme
        window.configManager.applyTheme(newSettings.theme);
        
        this.showNotification('Settings applied successfully');
    }

    /**
     * Reset to default settings
     */
    resetSettings(windowId) {
        if (!window.configManager) return;
        
        if (confirm('Are you sure you want to reset all settings to default?')) {
            const defaultSettings = {
                theme: 'light',
                systemName: 'BrowserOS',
                showDesktopIcons: true,
                enableAnimations: true,
                autoHideDock: false
            };
            
            window.configManager.updateSettings(defaultSettings);
            window.configManager.applyTheme('light');
            
            // Refresh the window
            windowManager.closeWindow(windowId);
            this.launch();
            
            this.showNotification('Settings reset to defaults');
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'success') {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#dc3545' : '#28a745'};
            color: white;
            border-radius: 6px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Test error reporting system
     */
    testErrorReporting() {
        if (window.errorReporter) {
            const testError = new Error('This is a test error to verify the error reporting system is working correctly.');
            
            window.errorReporter.reportManualError(testError, {
                component: 'Settings',
                action: 'Test Error Reporting',
                testMode: true,
                userInitiated: true
            });
            
            this.showNotification('Test error report generated! Check your email or the error dialog.');
        } else {
            this.showNotification('Error reporting system not available', 'error');
        }
    }
}

// Initialize Settings app
try {
    window.settingsApp = new SettingsApp();
    console.log('📱 SettingsApp instance created');
} catch (error) {
    console.error('❌ Failed to create SettingsApp:', error);
    // Create a minimal fallback
    window.settingsApp = {
        appId: 'settings',
        windows: new Map(),
        launch: () => {
            console.error('SettingsApp not properly initialized');
            return null;
        }
    };
}
