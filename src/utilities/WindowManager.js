/**
 * Window Manager - Handles application windows
 */
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.zIndexCounter = 100;
        this.activeWindow = null;
        this.windowsContainer = null;
        this.previousViewport = { width: window.innerWidth, height: window.innerHeight };
        
        this.init();
    }

    init() {
        this.windowsContainer = document.getElementById('windows-container');
        this.setupEventListeners();
        this.setupResponsiveHandlers();
    }

    setupEventListeners() {
        // Handle window clicks for focus management
        document.addEventListener('mousedown', (e) => {
            const window = e.target.closest('.window');
            if (window) {
                this.focusWindow(window.id);
            }
        });

        // WindowManager should NOT listen for app:launch events directly
        // Applications handle their own launch events and call windowManager.openWindow()

        // Listen for window close events
        eventManager.on('window:close', (windowId) => {
            this.closeWindow(windowId);
        });

        // Listen for window minimize events
        eventManager.on('window:minimize', (windowId) => {
            this.minimizeWindow(windowId);
        });

        // Listen for window maximize events
        eventManager.on('window:maximize', (windowId) => {
            this.toggleMaximizeWindow(windowId);
        });
    }

    /**
     * Setup responsive handlers for window management
     */
    setupResponsiveHandlers() {
        // Handle window resize for responsive adjustments
        window.addEventListener('resize', () => {
            this.handleViewportResize();
        });

        // Handle orientation changes on mobile/tablets
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleViewportResize();
            }, 100);
        });

        // Handle display changes (connecting/disconnecting monitors)
        if (screen && screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.handleViewportResize();
            });
        }
    }

    /**
     * Handle viewport resize and adjust windows accordingly
     */
    handleViewportResize() {
        const currentViewport = { width: window.innerWidth, height: window.innerHeight };
        const scaleX = currentViewport.width / this.previousViewport.width;
        const scaleY = currentViewport.height / this.previousViewport.height;

        this.windows.forEach((windowData) => {
            const { element, config, isMaximized, isMinimized } = windowData;
            
            // Skip adjustment for minimized or maximized windows
            if (isMinimized || isMaximized) {
                return;
            }

            // Calculate new responsive dimensions and positions
            const newConfig = this.calculateResponsiveWindowBounds(config, scaleX, scaleY);
            
            // Apply responsive bounds
            this.applyWindowBounds(element, newConfig);
            
            // Update stored config
            Object.assign(config, newConfig);
        });

        this.previousViewport = currentViewport;
    }

    /**
     * Calculate responsive window bounds based on viewport scaling
     */
    calculateResponsiveWindowBounds(config, scaleX, scaleY) {
        const minWidth = Math.max(300, window.innerWidth * 0.2);
        const minHeight = Math.max(200, window.innerHeight * 0.2);
        const maxWidth = window.innerWidth * 0.9;
        const maxHeight = (window.innerHeight - 100) * 0.9; // Account for menubar/dock

        // Scale dimensions responsively
        let newWidth = Math.min(maxWidth, Math.max(minWidth, config.width * scaleX));
        let newHeight = Math.min(maxHeight, Math.max(minHeight, config.height * scaleY));

        // Scale position responsively
        let newX = Math.max(0, Math.min(window.innerWidth - newWidth, config.x * scaleX));
        let newY = Math.max(32, Math.min(window.innerHeight - newHeight - 60, config.y * scaleY)); // Account for menubar (32px) and dock (60px)

        return {
            width: Math.round(newWidth),
            height: Math.round(newHeight),
            x: Math.round(newX),
            y: Math.round(newY)
        };
    }

    /**
     * Apply responsive bounds to window element
     */
    applyWindowBounds(element, bounds) {
        element.style.cssText = `
            width: ${bounds.width}px;
            height: ${bounds.height}px;
            left: ${bounds.x}px;
            top: ${bounds.y}px;
            z-index: ${element.style.zIndex || this.zIndexCounter};
        `;
    }

    /**
     * Get responsive window position for new windows
     */
    getResponsiveWindowPosition(width, height) {
        const availableWidth = window.innerWidth - width;
        const availableHeight = window.innerHeight - height - 100; // Account for menubar/dock
        
        // Use viewport-relative positioning
        const x = Math.max(0, Math.random() * availableWidth);
        const y = Math.max(32, 32 + Math.random() * Math.max(0, availableHeight));
        
        return { x, y };
    }

    /**
     * Create and open a new window
     * @param {string} appId 
     * @param {string} title 
     * @param {string} content 
     * @param {Object} options 
     */
    openWindow(appId, title, content, options = {}) {
        try {
            const windowId = `window-${appId}-${Date.now()}`;
            
            // Calculate responsive default dimensions
            const baseWidth = Math.min(800, window.innerWidth * 0.7);
            const baseHeight = Math.min(600, window.innerHeight * 0.7);
            
            const defaultOptions = {
                width: baseWidth,
                height: baseHeight,
                x: 0,
                y: 0,
                resizable: true,
                minimizable: true,
                maximizable: true,
                closable: true
            };

            const config = { ...defaultOptions, ...options };
            
            // Get responsive position if not specified
            if (config.x === 0 && config.y === 0) {
                const position = this.getResponsiveWindowPosition(config.width, config.height);
                config.x = position.x;
                config.y = position.y;
            }

        // Create window element
        const windowElement = document.createElement('div');
        windowElement.id = windowId;
        windowElement.setAttribute('data-window-id', windowId);
        windowElement.className = 'window fade-in';
        windowElement.style.cssText = `
            width: ${config.width}px;
            height: ${config.height}px;
            left: ${config.x}px;
            top: ${config.y}px;
            z-index: ${++this.zIndexCounter};
        `;

        // Create window header
        const header = document.createElement('div');
        header.className = 'window-header';
        header.innerHTML = `
            <div class="window-controls">
                <div class="window-control close" data-action="close">×</div>
                <div class="window-control minimize" data-action="minimize">−</div>
                <div class="window-control maximize" data-action="maximize">+</div>
            </div>
            <div class="window-title">${title}</div>
        `;

        // Create window content
        const contentElement = document.createElement('div');
        contentElement.className = 'window-content';
        contentElement.innerHTML = content;

        // Create resize handles
        const resizeHandles = [
            { class: 'n', position: 'north' },
            { class: 's', position: 'south' },
            { class: 'e', position: 'east' },
            { class: 'w', position: 'west' },
            { class: 'ne', position: 'northeast' },
            { class: 'nw', position: 'northwest' },
            { class: 'se', position: 'southeast' },
            { class: 'sw', position: 'southwest' }
        ];

        resizeHandles.forEach(handle => {
            const handleElement = document.createElement('div');
            handleElement.className = `window-resize-handle ${handle.class}`;
            handleElement.dataset.resize = handle.position;
            windowElement.appendChild(handleElement);
        });

        windowElement.appendChild(header);
        windowElement.appendChild(contentElement);
        this.windowsContainer.appendChild(windowElement);

        // Store window data
        this.windows.set(windowId, {
            id: windowId,
            appId,
            title,
            element: windowElement,
            config,
            isMaximized: false,
            isMinimized: false,
            originalBounds: { ...config }
        });

        // Setup window interactions
        this.setupWindowInteractions(windowId);
        this.focusWindow(windowId);

        // Emit window opened event
        eventManager.emit('window:opened', { windowId, appId, title });

        // Update dock indicator
        eventManager.emit('dock:updateIndicator', { appId, active: true });

        return windowId;
        
        } catch (error) {
            console.error('❌ Failed to open window:', error);
            
            // Report error if error reporter is available
            if (window.errorReporter) {
                window.errorReporter.reportManualError(error, {
                    component: 'WindowManager',
                    action: 'openWindow',
                    appId: appId,
                    title: title
                });
            }
            
            // Show user-friendly error
            SystemUtils.showNotification('System Error', 'Failed to open application window', 5000);
            return null;
        }
    }

    /**
     * Setup window interactions (dragging, resizing, controls)
     * @param {string} windowId 
     */
    setupWindowInteractions(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const header = windowElement.querySelector('.window-header');
        const controls = windowElement.querySelectorAll('.window-control');

        // Window dragging
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('window-control')) return;
            
            isDragging = true;
            const rect = windowElement.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            windowElement.style.cursor = 'grabbing';
            this.focusWindow(windowId);
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging || windowData.isMaximized) return;
            
            const x = Math.max(0, Math.min(window.innerWidth - windowElement.offsetWidth, e.clientX - dragOffset.x));
            const y = Math.max(28, Math.min(window.innerHeight - windowElement.offsetHeight - 80, e.clientY - dragOffset.y));
            
            windowElement.style.left = `${x}px`;
            windowElement.style.top = `${y}px`;
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                windowElement.style.cursor = '';
            }
        });

        // Window controls
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = control.dataset.action;
                
                switch (action) {
                    case 'close':
                        this.closeWindow(windowId);
                        break;
                    case 'minimize':
                        this.minimizeWindow(windowId);
                        break;
                    case 'maximize':
                        this.toggleMaximizeWindow(windowId);
                        break;
                }
            });
        });

        // Double-click to maximize
        header.addEventListener('dblclick', (e) => {
            if (!e.target.classList.contains('window-control')) {
                this.toggleMaximizeWindow(windowId);
            }
        });

        // Window resizing
        this.setupWindowResizing(windowId);
    }

    /**
     * Setup window resizing functionality
     * @param {string} windowId 
     */
    setupWindowResizing(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowData.element;
        const resizeHandles = windowElement.querySelectorAll('.window-resize-handle');
        
        let isResizing = false;
        let resizeDirection = null;
        let resizeStartBounds = {};
        let resizeStartMouse = {};

        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', (e) => {
                if (windowData.isMaximized) return; // Can't resize maximized windows
                
                e.preventDefault();
                e.stopPropagation();
                
                isResizing = true;
                resizeDirection = handle.dataset.resize;
                
                const rect = windowElement.getBoundingClientRect();
                resizeStartBounds = {
                    width: rect.width,
                    height: rect.height,
                    left: rect.left,
                    top: rect.top
                };
                
                resizeStartMouse = {
                    x: e.clientX,
                    y: e.clientY
                };
                
                // Prevent text selection during resize
                document.body.style.userSelect = 'none';
                document.body.style.cursor = getComputedStyle(handle).cursor;
                
                this.focusWindow(windowId);
            });
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaX = e.clientX - resizeStartMouse.x;
            const deltaY = e.clientY - resizeStartMouse.y;
            
            let newBounds = { ...resizeStartBounds };
            
            // Calculate new dimensions based on resize direction
            switch (resizeDirection) {
                case 'north':
                    newBounds.height = Math.max(200, resizeStartBounds.height - deltaY);
                    newBounds.top = resizeStartBounds.top + (resizeStartBounds.height - newBounds.height);
                    break;
                    
                case 'south':
                    newBounds.height = Math.max(200, resizeStartBounds.height + deltaY);
                    break;
                    
                case 'east':
                    newBounds.width = Math.max(300, resizeStartBounds.width + deltaX);
                    break;
                    
                case 'west':
                    newBounds.width = Math.max(300, resizeStartBounds.width - deltaX);
                    newBounds.left = resizeStartBounds.left + (resizeStartBounds.width - newBounds.width);
                    break;
                    
                case 'northeast':
                    newBounds.width = Math.max(300, resizeStartBounds.width + deltaX);
                    newBounds.height = Math.max(200, resizeStartBounds.height - deltaY);
                    newBounds.top = resizeStartBounds.top + (resizeStartBounds.height - newBounds.height);
                    break;
                    
                case 'northwest':
                    newBounds.width = Math.max(300, resizeStartBounds.width - deltaX);
                    newBounds.height = Math.max(200, resizeStartBounds.height - deltaY);
                    newBounds.left = resizeStartBounds.left + (resizeStartBounds.width - newBounds.width);
                    newBounds.top = resizeStartBounds.top + (resizeStartBounds.height - newBounds.height);
                    break;
                    
                case 'southeast':
                    newBounds.width = Math.max(300, resizeStartBounds.width + deltaX);
                    newBounds.height = Math.max(200, resizeStartBounds.height + deltaY);
                    break;
                    
                case 'southwest':
                    newBounds.width = Math.max(300, resizeStartBounds.width - deltaX);
                    newBounds.height = Math.max(200, resizeStartBounds.height + deltaY);
                    newBounds.left = resizeStartBounds.left + (resizeStartBounds.width - newBounds.width);
                    break;
            }
            
            // Constrain to viewport
            newBounds.left = Math.max(0, Math.min(window.innerWidth - newBounds.width, newBounds.left));
            newBounds.top = Math.max(28, Math.min(window.innerHeight - newBounds.height - 80, newBounds.top));
            
            // Apply new bounds
            windowElement.style.width = `${newBounds.width}px`;
            windowElement.style.height = `${newBounds.height}px`;
            windowElement.style.left = `${newBounds.left}px`;
            windowElement.style.top = `${newBounds.top}px`;
            
            // Emit resize event for responsive content
            this.handleWindowResize(windowId, newBounds);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                resizeDirection = null;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
                
                // Update stored window bounds
                const rect = windowElement.getBoundingClientRect();
                windowData.config.width = rect.width;
                windowData.config.height = rect.height;
                windowData.config.x = rect.left;
                windowData.config.y = rect.top;
            }
        });
    }

    /**
     * Handle window resize events to make content responsive
     * @param {string} windowId 
     * @param {Object} bounds 
     */
    handleWindowResize(windowId, bounds) {
        // Emit resize event for applications to handle responsive behavior
        eventManager.emit('window:resize', {
            windowId,
            bounds,
            width: bounds.width,
            height: bounds.height
        });
    }

    /**
     * Focus a window (bring to front)
     * @param {string} windowId 
     */
    focusWindow(windowId) {
        if (!this.windows.has(windowId)) return;

        const windowData = this.windows.get(windowId);
        windowData.element.style.zIndex = ++this.zIndexCounter;
        this.activeWindow = windowId;

        // Remove active class from other windows
        this.windows.forEach((data, id) => {
            data.element.classList.toggle('active', id === windowId);
        });

        eventManager.emit('window:focused', { windowId });
    }

    /**
     * Close a window
     * @param {string} windowId 
     */
    closeWindow(windowId) {
        if (!this.windows.has(windowId)) return;

        const windowData = this.windows.get(windowId);
        // Remove fade-in to prevent animation conflict that causes blinking
        windowData.element.classList.remove('fade-in');
        windowData.element.classList.add('scale-out');
        
        setTimeout(() => {
            windowData.element.remove();
            this.windows.delete(windowId);

            // Update dock indicator if no windows of this app are open
            const hasOpenWindows = Array.from(this.windows.values())
                .some(w => w.appId === windowData.appId);
            
            if (!hasOpenWindows) {
                eventManager.emit('dock:updateIndicator', { 
                    appId: windowData.appId, 
                    active: false 
                });
            }

            eventManager.emit('window:closed', { windowId, appId: windowData.appId });
        }, 200);
    }

    /**
     * Minimize a window
     * @param {string} windowId 
     */
    minimizeWindow(windowId) {
        if (!this.windows.has(windowId)) return;

        const windowData = this.windows.get(windowId);
        windowData.isMinimized = true;
        windowData.element.classList.add('minimized');

        eventManager.emit('window:minimized', { windowId });
    }

    /**
     * Restore a minimized window
     * @param {string} windowId 
     */
    restoreWindow(windowId) {
        if (!this.windows.has(windowId)) return;

        const windowData = this.windows.get(windowId);
        windowData.isMinimized = false;
        windowData.element.classList.remove('minimized');
        this.focusWindow(windowId);

        eventManager.emit('window:restored', { windowId });
    }

    /**
     * Toggle window maximize state
     * @param {string} windowId 
     */
    toggleMaximizeWindow(windowId) {
        if (!this.windows.has(windowId)) return;

        const windowData = this.windows.get(windowId);
        
        if (windowData.isMaximized) {
            // Restore
            const bounds = windowData.originalBounds;
            windowData.element.style.cssText = `
                width: ${bounds.width}px;
                height: ${bounds.height}px;
                left: ${bounds.x}px;
                top: ${bounds.y}px;
                z-index: ${windowData.element.style.zIndex};
            `;
            windowData.element.classList.remove('maximized');
            windowData.isMaximized = false;
        } else {
            // Maximize
            windowData.element.classList.add('maximized');
            windowData.isMaximized = true;
        }

        eventManager.emit('window:maximized', { windowId, isMaximized: windowData.isMaximized });
    }

    /**
     * Get window by ID
     * @param {string} windowId 
     * @returns {Object|null}
     */
    getWindow(windowId) {
        return this.windows.get(windowId) || null;
    }

    /**
     * Get all windows for an app
     * @param {string} appId 
     * @returns {Array}
     */
    getWindowsByApp(appId) {
        return Array.from(this.windows.values()).filter(w => w.appId === appId);
    }

    /**
     * Get active window
     * @returns {Object|null}
     */
    getActiveWindow() {
        return this.activeWindow ? this.windows.get(this.activeWindow) : null;
    }
}

// Create global window manager instance
window.windowManager = new WindowManager();
