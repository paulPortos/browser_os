/**
 * Configuration Manager - Handles persistent system configuration
 * Stores user preferences, file system, and application settings
 */
class ConfigManager {
    constructor() {
        this.configKey = 'browserOS_config';
        this.config = this.loadConfig();
        this.initialized = false;
    }

    /**
     * Get default configuration structure
     */
    getDefaultConfig() {
        return {
            version: '1.0.0',
            system: {
                theme: 'light', // 'light' or 'dark'
                wallpaper: 'default',
                soundEnabled: true,
                language: 'en',
                timezone: 'UTC',
                startupApps: [],
                lastSaved: new Date().toISOString()
            },
            desktop: {
                iconSize: 'medium', // 'small', 'medium', 'large'
                iconArrangement: 'grid',
                showHidden: false,
                sortBy: 'name' // 'name', 'date', 'size', 'type'
            },
            applications: {
                textEditor: {
                    fontSize: 14,
                    wordWrap: true,
                    theme: 'default',
                    autoSave: true
                },
                terminal: {
                    fontSize: 14,
                    theme: 'dark',
                    historySize: 1000
                },
                finder: {
                    viewMode: 'list', // 'list', 'icons', 'columns'
                    showSidebar: true,
                    sortBy: 'name'
                }
            },
            fileSystem: {
                '/': {
                    type: 'folder',
                    name: 'Root',
                    children: {
                        'Applications': {
                            type: 'folder',
                            name: 'Applications',
                            children: {}
                        },
                        'Documents': {
                            type: 'folder',
                            name: 'Documents',
                            children: {
                                'Welcome.txt': {
                                    type: 'file',
                                    name: 'Welcome.txt',
                                    content: 'Welcome to BrowserOS!\n\nThis is your Documents folder where you can store your files.',
                                    size: 89,
                                    created: new Date().toISOString(),
                                    modified: new Date().toISOString()
                                },
                                'Sample Folder': {
                                    type: 'folder',
                                    name: 'Sample Folder',
                                    children: {
                                        'README.md': {
                                            type: 'file',
                                            name: 'README.md',
                                            content: '# Sample File\n\nThis is a sample markdown file in a subfolder.',
                                            size: 58,
                                            created: new Date().toISOString(),
                                            modified: new Date().toISOString()
                                        }
                                    }
                                }
                            }
                        },
                        'Desktop': {
                            type: 'folder',
                            name: 'Desktop',
                            children: {}
                        },
                        'Downloads': {
                            type: 'folder',
                            name: 'Downloads',
                            children: {}
                        },
                        'Pictures': {
                            type: 'folder',
                            name: 'Pictures',
                            children: {}
                        },
                        'Music': {
                            type: 'folder',
                            name: 'Music',
                            children: {}
                        },
                        'Videos': {
                            type: 'folder',
                            name: 'Videos',
                            children: {}
                        }
                    }
                }
            },
            windows: {
                lastPositions: {},
                preferences: {
                    rememberSize: true,
                    rememberPosition: true,
                    cascadeOffset: 30
                }
            }
        };
    }

    /**
     * Load configuration from localStorage
     */
    loadConfig() {
        try {
            const stored = localStorage.getItem(this.configKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Merge with defaults to handle new config options
                return this.mergeWithDefaults(parsed, this.getDefaultConfig());
            }
        } catch (error) {
            console.warn('Failed to load config from localStorage:', error);
        }
        
        return this.getDefaultConfig();
    }

    /**
     * Merge stored config with defaults to handle version upgrades
     */
    mergeWithDefaults(stored, defaults) {
        const result = JSON.parse(JSON.stringify(defaults)); // Deep clone defaults
        
        const mergeObjects = (target, source) => {
            for (const key in source) {
                if (source.hasOwnProperty(key)) {
                    if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                        if (!target[key]) target[key] = {};
                        mergeObjects(target[key], source[key]);
                    } else {
                        target[key] = source[key];
                    }
                }
            }
        };
        
        mergeObjects(result, stored);
        return result;
    }

    /**
     * Save configuration to localStorage
     */
    saveConfig() {
        try {
            this.config.system.lastSaved = new Date().toISOString();
            localStorage.setItem(this.configKey, JSON.stringify(this.config, null, 2));
            console.log('✅ Configuration saved successfully');
            
            // Emit save event
            if (typeof eventManager !== 'undefined') {
                eventManager.emit('config:saved', this.config);
            }
        } catch (error) {
            console.error('❌ Failed to save configuration:', error);
        }
    }

    /**
     * Get configuration value by path
     * @param {string} path - Dot notation path (e.g., 'system.theme')
     */
    get(path) {
        const keys = path.split('.');
        let current = this.config;
        
        for (const key of keys) {
            if (current && current.hasOwnProperty(key)) {
                current = current[key];
            } else {
                return undefined;
            }
        }
        
        return current;
    }

    /**
     * Set configuration value by path
     * @param {string} path - Dot notation path
     * @param {*} value - Value to set
     * @param {boolean} save - Whether to save immediately
     */
    set(path, value, save = true) {
        const keys = path.split('.');
        let current = this.config;
        
        // Navigate to parent object
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key]) {
                current[key] = {};
            }
            current = current[key];
        }
        
        // Set the value
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
        
        if (save) {
            this.saveConfig();
        }
    }

    /**
     * Get system settings (for Settings app compatibility)
     * @returns {Object} Settings object
     */
    getSettings() {
        return {
            theme: this.get('system.theme') || 'light',
            systemName: this.get('system.systemName') || 'BrowserOS',
            showDesktopIcons: this.get('desktop.showDesktopIcons') !== false,
            enableAnimations: this.get('system.enableAnimations') !== false,
            autoHideDock: this.get('system.autoHideDock') || false,
            soundEnabled: this.get('system.soundEnabled') !== false
        };
    }

    /**
     * Update system settings (for Settings app compatibility)
     * @param {Object} settings - Settings object to merge
     */
    updateSettings(settings) {
        if (settings.theme) {
            this.set('system.theme', settings.theme, false);
        }
        if (settings.systemName) {
            this.set('system.systemName', settings.systemName, false);
        }
        if (typeof settings.showDesktopIcons === 'boolean') {
            this.set('desktop.showDesktopIcons', settings.showDesktopIcons, false);
        }
        if (typeof settings.enableAnimations === 'boolean') {
            this.set('system.enableAnimations', settings.enableAnimations, false);
        }
        if (typeof settings.autoHideDock === 'boolean') {
            this.set('system.autoHideDock', settings.autoHideDock, false);
        }
        if (typeof settings.soundEnabled === 'boolean') {
            this.set('system.soundEnabled', settings.soundEnabled, false);
        }
        
        // Save all changes at once
        this.saveConfig();
        
        // Emit change event
        if (typeof eventManager !== 'undefined') {
            eventManager.emit('config:changed', { settings, config: this.config });
        }
    }

    /**
     * Get the entire configuration object
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.config)); // Return deep copy
    }

    /**
     * Reset configuration to defaults
     */
    reset() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
    }

    /**
     * Apply system-wide settings based on config
     */
    applySystemSettings() {
        console.log('🔧 Applying system settings from config...');
        
        // Apply theme
        this.applyTheme(this.get('system.theme'));
        
        // Apply other settings
        this.applyDesktopSettings();
        this.applyApplicationSettings();
        
        console.log('✅ System settings applied');
    }

    /**
     * Apply theme (light/dark mode)
     */
    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('light-theme', 'dark-theme');
        body.classList.add(`${theme}-theme`);
        
        // Update CSS custom properties for theme
        const root = document.documentElement;
        if (theme === 'dark') {
            root.style.setProperty('--bg-color', '#1a1a1a');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--window-bg', 'rgba(30, 30, 30, 0.95)');
            root.style.setProperty('--menubar-bg', 'rgba(40, 40, 40, 0.9)');
        } else {
            root.style.setProperty('--bg-color', '#ffffff');
            root.style.setProperty('--text-color', '#000000');
            root.style.setProperty('--window-bg', 'rgba(255, 255, 255, 0.95)');
            root.style.setProperty('--menubar-bg', 'rgba(240, 240, 240, 0.9)');
        }
        
        console.log(`🎨 Applied ${theme} theme`);
    }

    /**
     * Apply desktop settings
     */
    applyDesktopSettings() {
        // Apply icon size, arrangement, etc.
        const iconSize = this.get('desktop.iconSize');
        const root = document.documentElement;
        
        switch (iconSize) {
            case 'small':
                root.style.setProperty('--desktop-icon-size', '60px');
                break;
            case 'large':
                root.style.setProperty('--desktop-icon-size', '100px');
                break;
            default: // medium
                root.style.setProperty('--desktop-icon-size', '80px');
        }
    }

    /**
     * Apply application-specific settings
     */
    applyApplicationSettings() {
        // This will be called by individual applications to apply their settings
        if (typeof eventManager !== 'undefined') {
            eventManager.emit('config:apply-app-settings', this.config.applications);
        }
    }

    /**
     * File system operations
     */
    
    /**
     * Get file or folder at path
     * @param {string} path - File system path
     */
    getFile(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.config.fileSystem['/'];
        
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    /**
     * Create file or folder
     * @param {string} path - Path where to create
     * @param {string} name - Name of file/folder
     * @param {string} type - 'file' or 'folder'
     * @param {string} content - File content (for files)
     */
    createFile(path, name, type, content = '') {
        const parent = this.getFile(path);
        if (!parent || parent.type !== 'folder') {
            return false;
        }

        if (!parent.children) {
            parent.children = {};
        }

        parent.children[name] = {
            type,
            name,
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };

        if (type === 'file') {
            parent.children[name].content = content;
            parent.children[name].size = content.length;
        } else {
            parent.children[name].children = {};
        }

        this.saveConfig();
        return true;
    }

    /**
     * Delete file or folder
     * @param {string} path - Full path to file/folder
     */
    deleteFile(path) {
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        const parentPath = '/' + parts.join('/');
        
        const parent = this.getFile(parentPath);
        if (parent && parent.children && parent.children[fileName]) {
            delete parent.children[fileName];
            this.saveConfig();
            return true;
        }
        
        return false;
    }

    /**
     * Update file content
     * @param {string} path - Full path to file
     * @param {string} content - New content
     */
    updateFileContent(path, content) {
        const file = this.getFile(path);
        if (file && file.type === 'file') {
            file.content = content;
            file.size = content.length;
            file.modified = new Date().toISOString();
            this.saveConfig();
            return true;
        }
        return false;
    }

    /**
     * List files in directory
     * @param {string} path - Directory path
     */
    listFiles(path) {
        const folder = this.getFile(path);
        if (folder && folder.type === 'folder' && folder.children) {
            return Object.values(folder.children);
        }
        return [];
    }

    /**
     * Initialize the configuration system
     */
    init() {
        if (this.initialized) return;
        
        console.log('🔧 Initializing Configuration Manager...');
        
        // Apply settings on load
        this.applySystemSettings();
        
        // Auto-save every 30 seconds
        setInterval(() => {
            this.saveConfig();
        }, 30000);
        
        this.initialized = true;
        console.log('✅ Configuration Manager initialized');
    }
}

// Create global instance
window.configManager = new ConfigManager();
