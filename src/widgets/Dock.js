/**
 * Dock Widget - Handles the bottom dock with applications
 */
class Dock {
    constructor() {
        this.element = document.getElementById('dock');
        this.dockContainer = this.element.querySelector('.dock-container');
        this.applications = new Map();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.registerDefaultApps();
    }

    setupEventListeners() {
        // Handle dock item clicks
        this.dockContainer.addEventListener('click', (e) => {
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                this.handleDockClick(dockItem);
            }
        });

        // Handle dock item hover effects
        this.dockContainer.addEventListener('mouseover', (e) => {
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                this.showTooltip(dockItem);
            }
        });

        // Context menu for dock items
        this.dockContainer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const dockItem = e.target.closest('.dock-item');
            if (dockItem) {
                this.showDockContextMenu(dockItem, e.clientX, e.clientY);
            }
        });

        // Listen for app indicator updates
        eventManager.on('dock:updateIndicator', (data) => {
            this.updateAppIndicator(data.appId, data.active);
        });

        // Listen for app launches to animate dock
        eventManager.on('app:launch', (data) => {
            this.animateAppLaunch(data.appId);
        });
    }

    registerDefaultApps() {
        const defaultApps = [
            { id: 'finder', title: 'Finder', icon: '📁' },
            { id: 'terminal', title: 'Terminal', icon: '⚫' },
            { id: 'text-editor', title: 'TextEdit', icon: '📝' },
            { id: 'calculator', title: 'Calculator', icon: '🧮' },
            { id: 'browser', title: 'Browser', icon: '🌐' },
            { id: 'calendar', title: 'Calendar', icon: '📅' },
            { id: 'settings', title: 'System Preferences', icon: '⚙️' },
            { id: 'trash', title: 'Trash', icon: '🗑️' }
        ];

        defaultApps.forEach(app => {
            this.applications.set(app.id, app);
        });
    }

    handleDockClick(dockItem) {
        const appId = dockItem.dataset.app;
        const app = this.applications.get(appId);
        
        if (!app) return;

        // Special handling for trash
        if (appId === 'trash') {
            this.handleTrashClick();
            return;
        }

        // Check if app has open windows
        const openWindows = windowManager.getWindowsByApp(appId);
        
        if (openWindows.length === 0) {
            // Launch new instance
            this.launchApplication(appId, app.title);
        } else if (openWindows.length === 1) {
            // Focus or restore existing window
            const window = openWindows[0];
            if (window.isMinimized) {
                windowManager.restoreWindow(window.id);
            } else {
                windowManager.focusWindow(window.id);
            }
        } else {
            // Multiple windows - show window switcher or focus most recent
            const activeWindow = openWindows.find(w => w.element.style.zIndex === String(windowManager.zIndexCounter));
            if (activeWindow) {
                if (activeWindow.isMinimized) {
                    windowManager.restoreWindow(activeWindow.id);
                } else {
                    windowManager.focusWindow(activeWindow.id);
                }
            } else {
                windowManager.focusWindow(openWindows[0].id);
            }
        }

        // Add bounce animation
        this.animateAppLaunch(appId);
    }

    launchApplication(appId, title) {
        eventManager.emit('app:launch', {
            appId: appId,
            title: title
        });
    }

    animateAppLaunch(appId) {
        const dockItem = this.dockContainer.querySelector(`[data-app="${appId}"]`);
        if (dockItem) {
            dockItem.classList.add('bounce');
            setTimeout(() => {
                dockItem.classList.remove('bounce');
            }, 600);
        }
    }

    updateAppIndicator(appId, active) {
        const dockItem = this.dockContainer.querySelector(`[data-app="${appId}"]`);
        if (dockItem) {
            dockItem.classList.toggle('active', active);
        }
    }

    showTooltip(dockItem) {
        // Tooltip is handled by CSS ::before pseudo-element
        // This method can be used for custom tooltip logic if needed
    }

    showDockContextMenu(dockItem, x, y) {
        const appId = dockItem.dataset.app;
        const app = this.applications.get(appId);
        const openWindows = windowManager.getWindowsByApp(appId);
        
        if (!app) return;

        const menuItems = [];

        // Special handling for trash
        if (appId === 'trash') {
            menuItems.push(
                {
                    text: 'Empty Trash',
                    action: () => this.emptyTrash()
                }
            );
        } else {
            // Open/Show
            if (openWindows.length === 0) {
                menuItems.push({
                    text: `Open ${app.title}`,
                    action: () => this.launchApplication(appId, app.title)
                });
            } else {
                menuItems.push({
                    text: `Show ${app.title}`,
                    action: () => {
                        const window = openWindows[0];
                        if (window.isMinimized) {
                            windowManager.restoreWindow(window.id);
                        } else {
                            windowManager.focusWindow(window.id);
                        }
                    }
                });
            }

            // Show all windows if multiple
            if (openWindows.length > 1) {
                menuItems.push({ separator: true });
                openWindows.forEach((window, index) => {
                    menuItems.push({
                        text: `${window.title}${window.isMinimized ? ' (minimized)' : ''}`,
                        action: () => {
                            if (window.isMinimized) {
                                windowManager.restoreWindow(window.id);
                            } else {
                                windowManager.focusWindow(window.id);
                            }
                        }
                    });
                });
            }

            // Quit option if app is running
            if (openWindows.length > 0) {
                menuItems.push(
                    { separator: true },
                    {
                        text: `Quit ${app.title}`,
                        action: () => this.quitApplication(appId)
                    }
                );
            }

            menuItems.push(
                { separator: true },
                {
                    text: 'Options',
                    submenu: [
                        {
                            text: 'Keep in Dock',
                            disabled: true
                        },
                        {
                            text: 'Open at Login',
                            disabled: true
                        },
                        { separator: true },
                        {
                            text: 'Remove from Dock',
                            action: () => this.removeFromDock(appId)
                        }
                    ]
                }
            );
        }

        SystemUtils.showContextMenu(x, y, menuItems);
    }

    quitApplication(appId) {
        const windows = windowManager.getWindowsByApp(appId);
        windows.forEach(window => {
            windowManager.closeWindow(window.id);
        });
    }

    removeFromDock(appId) {
        SystemUtils.showModal(
            'Remove from Dock',
            `Are you sure you want to remove ${this.applications.get(appId).title} from the Dock?`,
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Remove', primary: true, value: 'remove' }
            ]
        ).then(result => {
            if (result === 'remove') {
                const dockItem = this.dockContainer.querySelector(`[data-app="${appId}"]`);
                if (dockItem && !dockItem.classList.contains('trash')) {
                    dockItem.classList.add('scale-out');
                    setTimeout(() => {
                        dockItem.remove();
                        this.applications.delete(appId);
                    }, 200);
                }
            }
        });
    }

    addToDock(appId, title, icon) {
        if (this.applications.has(appId)) return;

        const app = { id: appId, title, icon };
        this.applications.set(appId, app);

        // Find insertion point (before trash)
        const trashItem = this.dockContainer.querySelector('.dock-item.trash');
        const separator = this.dockContainer.querySelector('.dock-separator');

        const dockItem = SystemUtils.createElement('div', 'dock-item scale-in', {
            'data-app': appId,
            title: title,
            innerHTML: `
                <div class="dock-icon">${icon}</div>
                <div class="dock-indicator"></div>
            `
        });

        this.dockContainer.insertBefore(dockItem, separator);
    }

    handleTrashClick() {
        SystemUtils.showModal(
            'Trash',
            `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 48px; margin-bottom: 16px;">🗑️</div>
                    <h3>Trash is Empty</h3>
                    <p>Drag files here to delete them.</p>
                </div>
            `,
            [{ text: 'OK', primary: true }]
        );
    }

    emptyTrash() {
        SystemUtils.showModal(
            'Empty Trash',
            'Are you sure you want to permanently erase all items in the Trash? This action cannot be undone.',
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Empty Trash', primary: true, value: 'empty' }
            ]
        ).then(result => {
            if (result === 'empty') {
                SystemUtils.showNotification('Trash', 'Trash emptied successfully');
            }
        });
    }

    // Magnification effect (for future enhancement)
    enableMagnification() {
        let isHovering = false;
        
        this.dockContainer.addEventListener('mousemove', (e) => {
            if (!isHovering) return;
            
            const dockItems = this.dockContainer.querySelectorAll('.dock-item');
            const rect = this.dockContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            
            dockItems.forEach(item => {
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.left + itemRect.width / 2 - rect.left;
                const distance = Math.abs(mouseX - itemCenter);
                const maxDistance = 150;
                const scale = Math.max(1, 1.5 - (distance / maxDistance) * 0.5);
                
                item.style.transform = `scale(${scale})`;
            });
        });
        
        this.dockContainer.addEventListener('mouseenter', () => {
            isHovering = true;
        });
        
        this.dockContainer.addEventListener('mouseleave', () => {
            isHovering = false;
            const dockItems = this.dockContainer.querySelectorAll('.dock-item');
            dockItems.forEach(item => {
                item.style.transform = '';
            });
        });
    }
}

// Initialize dock
window.dock = new Dock();
