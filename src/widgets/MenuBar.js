/**
 * Menu Bar Widget - Handles the top menu bar
 */
class MenuBar {
    constructor() {
        this.element = document.getElementById('menubar');
        this.currentMenu = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSystemStatus();
        this.initializeSystemName();
    }

    initializeSystemName() {
        // Initialize system name from config when available
        if (window.configManager) {
            const settings = window.configManager.getSettings();
            if (settings && settings.systemName) {
                this.updateSystemName(settings.systemName);
            }
        }
        
        // Listen for system name changes
        if (window.eventManager) {
            eventManager.on('system:nameChanged', (data) => {
                this.updateSystemName(data.systemName);
            });
        }
    }

    updateSystemName(systemName) {
        const systemNameElement = this.element.querySelector('.menu-item.active');
        if (systemNameElement) {
            systemNameElement.textContent = systemName;
            console.log(`✅ MenuBar: Updated system name to "${systemName}"`);
        }
    }

    setupEventListeners() {
        // Handle menu clicks
        this.element.addEventListener('click', (e) => {
            const menuItem = e.target.closest('.menu-item');
            if (menuItem && !menuItem.classList.contains('system-item')) {
                this.handleMenuClick(menuItem);
            }
        });

        // Close menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.element.contains(e.target) && this.currentMenu) {
                this.closeCurrentMenu();
            }
        });

        // System event listeners
        eventManager.on('app:launch', (data) => {
            this.updateActiveApp(data.title);
        });

        eventManager.on('window:focused', (data) => {
            const windowData = windowManager.getWindow(data.windowId);
            if (windowData) {
                this.updateActiveApp(windowData.title);
            }
        });

        // Update system status periodically
        setInterval(() => this.updateSystemStatus(), 5000);
    }

    handleMenuClick(menuItem) {
        const menuText = menuItem.textContent.trim();
        
        switch (menuText) {
            case 'BrowserOS':
                this.showAboutMenu(menuItem);
                break;
            case 'File':
                this.showFileMenu(menuItem);
                break;
            case 'Edit':
                this.showEditMenu(menuItem);
                break;
            case 'View':
                this.showViewMenu(menuItem);
                break;
            case 'Window':
                this.showWindowMenu(menuItem);
                break;
            case 'Help':
                this.showHelpMenu(menuItem);
                break;
        }
    }

    showAboutMenu(menuItem) {
        const items = [
            {
                text: 'About BrowserOS',
                action: () => this.showAboutDialog()
            },
            { separator: true },
            {
                text: 'System Preferences...',
                action: () => eventManager.emit('app:launch', {
                    appId: 'settings',
                    title: 'System Preferences'
                })
            },
            { separator: true },
            {
                text: 'Force Quit Applications...',
                action: () => this.showForceQuitDialog()
            },
            { separator: true },
            {
                text: 'Sleep',
                action: () => this.systemSleep()
            },
            {
                text: 'Restart...',
                action: () => this.systemRestart()
            },
            {
                text: 'Shut Down...',
                action: () => this.systemShutdown()
            }
        ];

        this.showDropdownMenu(menuItem, items);
    }

    showFileMenu(menuItem) {
        const items = [
            {
                text: 'New',
                icon: '📄',
                action: () => eventManager.emit('app:launch', {
                    appId: 'text-editor',
                    title: 'TextEdit'
                })
            },
            {
                text: 'Open...',
                icon: '📂',
                action: () => eventManager.emit('app:launch', {
                    appId: 'finder',
                    title: 'Finder'
                })
            },
            { separator: true },
            {
                text: 'Close Window',
                disabled: !windowManager.getActiveWindow(),
                action: () => {
                    const activeWindow = windowManager.getActiveWindow();
                    if (activeWindow) {
                        windowManager.closeWindow(activeWindow.id);
                    }
                }
            }
        ];

        this.showDropdownMenu(menuItem, items);
    }

    showEditMenu(menuItem) {
        const items = [
            {
                text: 'Undo',
                icon: '↶',
                disabled: true
            },
            {
                text: 'Redo',
                icon: '↷',
                disabled: true
            },
            { separator: true },
            {
                text: 'Cut',
                icon: '✂️'
            },
            {
                text: 'Copy',
                icon: '📋'
            },
            {
                text: 'Paste',
                icon: '📄'
            }
        ];

        this.showDropdownMenu(menuItem, items);
    }

    showViewMenu(menuItem) {
        const items = [
            {
                text: 'Show Desktop',
                action: () => this.showDesktop()
            },
            { separator: true },
            {
                text: 'Enter Full Screen',
                action: () => this.toggleFullscreen()
            }
        ];

        this.showDropdownMenu(menuItem, items);
    }

    showWindowMenu(menuItem) {
        const openWindows = Array.from(windowManager.windows.values());
        const items = [
            {
                text: 'Minimize',
                disabled: !windowManager.getActiveWindow(),
                action: () => {
                    const activeWindow = windowManager.getActiveWindow();
                    if (activeWindow) {
                        windowManager.minimizeWindow(activeWindow.id);
                    }
                }
            },
            {
                text: 'Zoom',
                disabled: !windowManager.getActiveWindow(),
                action: () => {
                    const activeWindow = windowManager.getActiveWindow();
                    if (activeWindow) {
                        windowManager.toggleMaximizeWindow(activeWindow.id);
                    }
                }
            },
            { separator: true }
        ];

        // Add open windows to menu
        openWindows.forEach((windowData, index) => {
            items.push({
                text: `${windowData.title}`,
                action: () => {
                    if (windowData.isMinimized) {
                        windowManager.restoreWindow(windowData.id);
                    } else {
                        windowManager.focusWindow(windowData.id);
                    }
                }
            });
        });

        if (openWindows.length === 0) {
            items.push({
                text: 'No open windows',
                disabled: true
            });
        }

        this.showDropdownMenu(menuItem, items);
    }

    showHelpMenu(menuItem) {
        const items = [
            {
                text: 'BrowserOS Help',
                action: () => this.showHelpDialog()
            },
            { separator: true },
            {
                text: 'Keyboard Shortcuts',
                action: () => this.showShortcutsDialog()
            },
            {
                text: 'System Information',
                action: () => this.showSystemInfoDialog()
            }
        ];

        this.showDropdownMenu(menuItem, items);
    }

    showDropdownMenu(menuItem, items) {
        this.closeCurrentMenu();

        const rect = menuItem.getBoundingClientRect();
        const menu = SystemUtils.showContextMenu(rect.left, rect.bottom, items);
        menu.classList.add('menu-dropdown');
        this.currentMenu = menu;
        
        menuItem.classList.add('active');
        
        // Remove active class when menu closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
                    for (let node of mutation.removedNodes) {
                        if (node === menu) {
                            menuItem.classList.remove('active');
                            observer.disconnect();
                            this.currentMenu = null;
                            break;
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, { childList: true });
    }

    closeCurrentMenu() {
        if (this.currentMenu) {
            this.currentMenu.remove();
            this.currentMenu = null;
            
            // Remove active class from all menu items
            this.element.querySelectorAll('.menu-item.active').forEach(item => {
                item.classList.remove('active');
            });
        }
    }

    updateActiveApp(appName) {
        const activeMenuItem = this.element.querySelector('.menu-item.active');
        if (activeMenuItem && !activeMenuItem.classList.contains('system-item')) {
            activeMenuItem.textContent = appName;
        }
    }

    updateSystemStatus() {
        // Update Wi-Fi status
        const wifiElement = document.getElementById('wifi-status');
        if (wifiElement) {
            wifiElement.textContent = navigator.onLine ? '📶' : '📵';
        }
    }

    showAboutDialog() {
        SystemUtils.showModal(
            'About BrowserOS',
            `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🖥️</div>
                    <h2>BrowserOS</h2>
                    <p>Version 1.0.0</p>
                    <p>A browser-based operating system built with HTML, CSS, and JavaScript.</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #666;">
                        © 2025 BrowserOS Project
                    </p>
                </div>
            `,
            [{ text: 'OK', primary: true }]
        );
    }

    showSystemInfoDialog() {
        const info = SystemUtils.getSystemInfo();
        const infoHtml = `
            <table style="width: 100%; font-size: 12px;">
                <tr><td><strong>Platform:</strong></td><td>${info.platform}</td></tr>
                <tr><td><strong>Language:</strong></td><td>${info.language}</td></tr>
                <tr><td><strong>Screen:</strong></td><td>${info.screenWidth} × ${info.screenHeight}</td></tr>
                <tr><td><strong>Window:</strong></td><td>${info.windowWidth} × ${info.windowHeight}</td></tr>
                <tr><td><strong>Pixel Ratio:</strong></td><td>${info.pixelRatio}</td></tr>
                <tr><td><strong>Timezone:</strong></td><td>${info.timezone}</td></tr>
                <tr><td><strong>CPU Cores:</strong></td><td>${info.cores}</td></tr>
                <tr><td><strong>Memory:</strong></td><td>${info.memory} GB</td></tr>
                <tr><td><strong>Online:</strong></td><td>${info.online ? 'Yes' : 'No'}</td></tr>
            </table>
        `;

        SystemUtils.showModal('System Information', infoHtml, [{ text: 'OK', primary: true }]);
    }

    showHelpDialog() {
        SystemUtils.showModal(
            'BrowserOS Help',
            `
                <h3>Welcome to BrowserOS!</h3>
                <p>BrowserOS is a desktop-like environment that runs in your web browser.</p>
                
                <h4>Getting Started:</h4>
                <ul>
                    <li>Click on applications in the dock to launch them</li>
                    <li>Double-click desktop icons to open applications</li>
                    <li>Drag windows to move them around</li>
                    <li>Use window controls (close, minimize, maximize)</li>
                    <li>Right-click for context menus</li>
                </ul>
                
                <h4>Keyboard Shortcuts:</h4>
                <ul>
                    <li><strong>Cmd+Q:</strong> Quit application</li>
                    <li><strong>Cmd+W:</strong> Close window</li>
                    <li><strong>Cmd+M:</strong> Minimize window</li>
                    <li><strong>F11:</strong> Toggle fullscreen</li>
                </ul>
            `,
            [{ text: 'OK', primary: true }]
        );
    }

    showShortcutsDialog() {
        SystemUtils.showModal(
            'Keyboard Shortcuts',
            `
                <table style="width: 100%; font-size: 13px;">
                    <tr><td><strong>Cmd + N</strong></td><td>New document</td></tr>
                    <tr><td><strong>Cmd + O</strong></td><td>Open file</td></tr>
                    <tr><td><strong>Cmd + S</strong></td><td>Save document</td></tr>
                    <tr><td><strong>Cmd + W</strong></td><td>Close window</td></tr>
                    <tr><td><strong>Cmd + Q</strong></td><td>Quit application</td></tr>
                    <tr><td><strong>Cmd + M</strong></td><td>Minimize window</td></tr>
                    <tr><td><strong>Cmd + Tab</strong></td><td>Switch applications</td></tr>
                    <tr><td><strong>F11</strong></td><td>Toggle fullscreen</td></tr>
                    <tr><td><strong>Cmd + Space</strong></td><td>Spotlight search</td></tr>
                </table>
            `,
            [{ text: 'OK', primary: true }]
        );
    }

    showForceQuitDialog() {
        const openApps = Array.from(windowManager.windows.values())
            .reduce((apps, window) => {
                if (!apps.find(app => app.id === window.appId)) {
                    apps.push({ id: window.appId, title: window.title });
                }
                return apps;
            }, []);

        if (openApps.length === 0) {
            SystemUtils.showNotification('Force Quit', 'No applications are currently running');
            return;
        }

        // For now, just show a simple dialog
        SystemUtils.showModal(
            'Force Quit Applications',
            `
                <p>Select an application to force quit:</p>
                <div style="margin: 16px 0;">
                    ${openApps.map(app => `
                        <div style="padding: 8px; border: 1px solid #ddd; margin: 4px 0; border-radius: 4px;">
                            ${app.title}
                        </div>
                    `).join('')}
                </div>
            `,
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Force Quit', primary: true, value: 'quit' }
            ]
        );
    }

    showDesktop() {
        // Minimize all windows
        windowManager.windows.forEach((windowData) => {
            if (!windowData.isMinimized) {
                windowManager.minimizeWindow(windowData.id);
            }
        });
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    systemSleep() {
        SystemUtils.showNotification('System', 'Sleep mode not available in browser environment');
    }

    systemRestart() {
        SystemUtils.showModal(
            'Restart',
            'Are you sure you want to restart BrowserOS? All unsaved changes will be lost.',
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Restart', primary: true, value: 'restart' }
            ]
        ).then(result => {
            if (result === 'restart') {
                location.reload();
            }
        });
    }

    systemShutdown() {
        SystemUtils.showModal(
            'Shut Down',
            'Are you sure you want to shut down BrowserOS?',
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Shut Down', primary: true, value: 'shutdown' }
            ]
        ).then(result => {
            if (result === 'shutdown') {
                window.close();
            }
        });
    }
}

// Initialize menu bar
window.menuBar = new MenuBar();
