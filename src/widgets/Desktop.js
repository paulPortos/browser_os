/**
 * Desktop Widget - Handles desktop interactions and icons
 */
class Desktop {
    constructor() {
        this.element = document.getElementById('desktop');
        this.desktopContent = document.getElementById('desktop-content');
        this.selectedIcons = new Set();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDesktopIcons();
    }

    setupEventListeners() {
        // Desktop click handling
        this.desktopContent.addEventListener('click', (e) => {
            if (e.target === this.desktopContent) {
                this.clearSelection();
            }
        });

        // Desktop icon interactions with double-click detection
        let clickTimeout = null;
        this.desktopContent.addEventListener('click', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                // Clear any existing timeout to prevent single-click action after double-click
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                    clickTimeout = null;
                    return;
                }
                
                // Set a timeout to handle single-click after checking for double-click
                clickTimeout = setTimeout(() => {
                    this.handleIconClick(icon, e);
                    clickTimeout = null;
                }, 300);
            }
        });

        this.desktopContent.addEventListener('dblclick', (e) => {
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                // Clear the single-click timeout
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                    clickTimeout = null;
                }
                this.handleIconDoubleClick(icon);
            }
        });

        // Desktop context menu
        this.element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const icon = e.target.closest('.desktop-icon');
            if (icon) {
                this.showIconContextMenu(icon, e.clientX, e.clientY);
            } else {
                this.showDesktopContextMenu(e.clientX, e.clientY);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle keyboard events for desktop interactions
            // Exclude input elements, textareas, and contenteditable elements
            if (e.target.tagName === 'INPUT' || 
                e.target.tagName === 'TEXTAREA' || 
                e.target.isContentEditable ||
                e.target.closest('.window') ||
                e.target.closest('.terminal-content') ||
                e.target.closest('#terminal-input')) {
                return;
            }
            
            if (e.target === document.body || this.element.contains(e.target)) {
                this.handleKeyboard(e);
            }
        });

        // Window resize handling
        window.addEventListener('resize', () => {
            this.repositionIcons();
        });

        // Drag and drop
        this.setupDragAndDrop();
    }

    setupDesktopIcons() {
        const icons = this.desktopContent.querySelectorAll('.desktop-icon');
        icons.forEach(icon => {
            this.setupIconInteractions(icon);
        });
    }

    setupIconInteractions(icon) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        let draggedIcons = new Map(); // Store positions for multiple icon dragging
        let finalPositions = new Map(); // Store final positions to avoid transform parsing
        let dragStartTimeout = null;
        let mouseDownPos = { x: 0, y: 0 };

        const updatePosition = (mouseX, mouseY) => {
            if (isDragging) {
                const containerRect = this.desktopContent.getBoundingClientRect();
                const targetX = Math.max(0, Math.min(containerRect.width - 80, mouseX - containerRect.left - dragOffset.x));
                const targetY = Math.max(0, Math.min(containerRect.height - 100, mouseY - containerRect.top - dragOffset.y));
                
                // Update all dragged icons immediately (no interpolation to avoid sudden movements)
                draggedIcons.forEach((iconData, dragIcon) => {
                    const offsetX = targetX - iconData.initialPos.x;
                    const offsetY = targetY - iconData.initialPos.y;
                    const newX = iconData.startPos.x + offsetX;
                    const newY = iconData.startPos.y + offsetY;
                    
                    // Constrain to desktop bounds
                    const constrainedX = Math.max(0, Math.min(containerRect.width - 80, newX));
                    const constrainedY = Math.max(0, Math.min(containerRect.height - 100, newY));
                    
                    // Store the final position for this icon
                    finalPositions.set(dragIcon, { x: constrainedX, y: constrainedY });
                    
                    dragIcon.style.transform = `translate3d(${constrainedX}px, ${constrainedY}px, 0)`;
                });
            }
        };

        const startDragging = (e) => {
            if (isDragging) return; // Already dragging
            
            isDragging = true;
            const rect = icon.getBoundingClientRect();
            const containerRect = this.desktopContent.getBoundingClientRect();
            
            // Calculate drag offset from mouse position to icon position
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            // Get the exact current position of the clicked icon
            const initialX = rect.left - containerRect.left;
            const initialY = rect.top - containerRect.top;
            
            // Setup all selected icons for dragging
            draggedIcons.clear();
            finalPositions.clear();
            const iconsToMove = this.selectedIcons.has(icon) ? this.selectedIcons : new Set([icon]);
            
            iconsToMove.forEach(dragIcon => {
                const dragRect = dragIcon.getBoundingClientRect();
                const currentX = dragRect.left - containerRect.left;
                const currentY = dragRect.top - containerRect.top;
                
                draggedIcons.set(dragIcon, {
                    initialPos: { x: initialX, y: initialY }, // Reference point for offset calculation
                    startPos: { x: currentX, y: currentY }    // Starting position of this icon
                });
                
                // Store initial position as current final position
                finalPositions.set(dragIcon, { x: currentX, y: currentY });
                
                // Switch to absolute positioning WITHOUT moving the icon visually
                dragIcon.classList.add('dragging');
                dragIcon.classList.add('dragged'); // Mark as permanently moved
                dragIcon.style.position = 'absolute';
                dragIcon.style.left = '0';
                dragIcon.style.top = '0';
                // Set the transform to exactly where the icon currently is
                dragIcon.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
            });
            
            // Prevent text selection and default drag behavior
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
        };

        icon.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click only
                // Store initial mouse position
                mouseDownPos.x = e.clientX;
                mouseDownPos.y = e.clientY;
                
                // Set a timeout to start dragging after a short delay
                // This allows double-clicks to work properly
                dragStartTimeout = setTimeout(() => {
                    startDragging(e);
                }, 150); // 150ms delay before starting drag
                
                // Don't prevent default here - let click/dblclick events work
            }
        });

        document.addEventListener('mousemove', (e) => {
            // If mouse moves significantly before timeout, start dragging immediately
            if (dragStartTimeout && !isDragging) {
                const deltaX = Math.abs(e.clientX - mouseDownPos.x);
                const deltaY = Math.abs(e.clientY - mouseDownPos.y);
                
                if (deltaX > 5 || deltaY > 5) { // 5px movement threshold
                    clearTimeout(dragStartTimeout);
                    dragStartTimeout = null;
                    startDragging(e);
                }
            }
            
            if (isDragging) {
                // Update positions immediately with no delay or interpolation
                updatePosition(e.clientX, e.clientY);
            }
        });

        document.addEventListener('mouseup', () => {
            // Clear drag start timeout if still pending
            if (dragStartTimeout) {
                clearTimeout(dragStartTimeout);
                dragStartTimeout = null;
            }
            
            if (isDragging) {
                isDragging = false;
                
                // Only remove the temporary dragging class - keep the dragged class and transform positioning
                draggedIcons.forEach((iconData, dragIcon) => {
                    // Remove only the visual dragging effects (opacity, scale, shadow)
                    dragIcon.classList.remove('dragging');
                    // Keep the 'dragged' class and transform positioning - no position switching!
                });
                
                // Clear maps
                draggedIcons.clear();
                finalPositions.clear();
                
                // Restore user selection and cursor
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        });
    }

    handleIconClick(icon, event) {
        if (event.ctrlKey || event.metaKey) {
            // Multi-select
            this.toggleIconSelection(icon);
        } else if (event.shiftKey && this.selectedIcons.size > 0) {
            // Range select (basic implementation)
            this.selectIconRange(icon);
        } else {
            // Single select
            this.clearSelection();
            this.selectIcon(icon);
        }
    }

    handleIconDoubleClick(icon) {
        const appId = icon.dataset.app;
        const appTitle = icon.querySelector('.label').textContent;
        
        this.launchApplication(appId, appTitle);
    }

    selectIcon(icon) {
        icon.classList.add('selected');
        this.selectedIcons.add(icon);
    }

    toggleIconSelection(icon) {
        if (this.selectedIcons.has(icon)) {
            icon.classList.remove('selected');
            this.selectedIcons.delete(icon);
        } else {
            icon.classList.add('selected');
            this.selectedIcons.add(icon);
        }
    }

    selectIconRange(endIcon) {
        // Basic range selection - select all icons between first selected and clicked icon
        const icons = Array.from(this.desktopContent.querySelectorAll('.desktop-icon'));
        const firstSelected = Array.from(this.selectedIcons)[0];
        const startIndex = icons.indexOf(firstSelected);
        const endIndex = icons.indexOf(endIcon);
        
        const [start, end] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
        
        for (let i = start; i <= end; i++) {
            this.selectIcon(icons[i]);
        }
    }

    clearSelection() {
        this.selectedIcons.forEach(icon => {
            icon.classList.remove('selected');
        });
        this.selectedIcons.clear();
    }

    launchApplication(appId, title) {
        eventManager.emit('app:launch', {
            appId: appId,
            title: title
        });
    }

    showIconContextMenu(icon, x, y) {
        const appId = icon.dataset.app;
        const appTitle = icon.querySelector('.label').textContent;
        
        const menuItems = [
            {
                text: `Open ${appTitle}`,
                icon: '📂',
                action: () => this.launchApplication(appId, appTitle)
            },
            {
                text: 'Get Info',
                icon: 'ℹ️',
                action: () => this.showIconInfo(icon)
            },
            { separator: true },
            {
                text: 'Move to Trash',
                icon: '🗑️',
                action: () => this.moveToTrash(icon)
            },
            { separator: true },
            {
                text: 'Rename',
                icon: '✏️',
                action: () => this.renameIcon(icon)
            },
            {
                text: 'Duplicate',
                icon: '📋',
                action: () => this.duplicateIcon(icon)
            }
        ];

        SystemUtils.showContextMenu(x, y, menuItems);
    }

    showDesktopContextMenu(x, y) {
        const menuItems = [
            {
                text: 'New Folder',
                icon: '📁',
                action: () => this.createNewFolder()
            },
            { separator: true },
            {
                text: 'Change Desktop Background...',
                icon: '🖼️',
                action: () => this.changeDesktopBackground()
            },
            { separator: true },
            {
                text: 'Clean Up',
                icon: '✨',
                action: () => this.cleanUpDesktop()
            },
            {
                text: 'Sort By',
                icon: '🔤',
                submenu: [
                    {
                        text: 'Name',
                        action: () => this.sortIconsBy('name')
                    },
                    {
                        text: 'Date Modified',
                        action: () => this.sortIconsBy('date')
                    },
                    {
                        text: 'Type',
                        action: () => this.sortIconsBy('type')
                    }
                ]
            },
            { separator: true },
            {
                text: 'Show View Options',
                action: () => this.showViewOptions()
            }
        ];

        SystemUtils.showContextMenu(x, y, menuItems);
    }

    showIconInfo(icon) {
        const appId = icon.dataset.app;
        const appTitle = icon.querySelector('.label').textContent;
        const iconEmoji = icon.querySelector('.icon').textContent;
        
        SystemUtils.showModal(
            `${appTitle} Info`,
            `
                <div style="text-align: center; margin: 20px 0;">
                    <div style="font-size: 64px; margin-bottom: 16px;">${iconEmoji}</div>
                    <h3>${appTitle}</h3>
                    <p><strong>Type:</strong> Application</p>
                    <p><strong>Application ID:</strong> ${appId}</p>
                    <p><strong>Created:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>Modified:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            `,
            [{ text: 'OK', primary: true }]
        );
    }

    moveToTrash(icon) {
        const appTitle = icon.querySelector('.label').textContent;
        
        SystemUtils.showModal(
            'Move to Trash',
            `Are you sure you want to move "${appTitle}" to the Trash?`,
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Move to Trash', primary: true, value: 'trash' }
            ]
        ).then(result => {
            if (result === 'trash') {
                icon.classList.add('scale-out');
                setTimeout(() => {
                    icon.remove();
                    SystemUtils.showNotification('Trash', `"${appTitle}" moved to Trash`);
                }, 200);
            }
        });
    }

    renameIcon(icon) {
        const currentName = icon.querySelector('.label').textContent;
        const labelElement = icon.querySelector('.label');
        
        // Create input field
        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.style.cssText = `
            width: 70px;
            font-size: 12px;
            text-align: center;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #007AFF;
            border-radius: 4px;
            padding: 2px;
        `;
        
        labelElement.replaceWith(input);
        input.focus();
        input.select();
        
        const finishRename = () => {
            const newName = input.value.trim() || currentName;
            const newLabel = document.createElement('div');
            newLabel.className = 'label';
            newLabel.textContent = newName;
            input.replaceWith(newLabel);
            
            if (newName !== currentName) {
                SystemUtils.showNotification('Desktop', `Renamed to "${newName}"`);
            }
        };
        
        input.addEventListener('blur', finishRename);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                input.blur();
            }
        });
    }

    duplicateIcon(icon) {
        const clone = icon.cloneNode(true);
        const label = clone.querySelector('.label');
        label.textContent = `${label.textContent} copy`;
        
        // Position slightly offset
        const rect = icon.getBoundingClientRect();
        const containerRect = this.desktopContent.getBoundingClientRect();
        
        clone.style.position = 'absolute';
        clone.style.left = `${rect.left - containerRect.left + 20}px`;
        clone.style.top = `${rect.top - containerRect.top + 20}px`;
        
        this.desktopContent.appendChild(clone);
        this.setupIconInteractions(clone);
        
        clone.classList.add('scale-in');
    }

    createNewFolder() {
        const folder = SystemUtils.createElement('div', 'desktop-icon scale-in', {
            'data-app': 'folder',
            innerHTML: `
                <div class="icon">📁</div>
                <div class="label">New Folder</div>
            `
        });
        
        const position = this.getNextAvailablePosition();
        folder.style.position = 'absolute';
        folder.style.left = `${position.x}px`;
        folder.style.top = `${position.y}px`;
        
        this.desktopContent.appendChild(folder);
        this.setupIconInteractions(folder);
        
        // Auto-rename
        setTimeout(() => this.renameIcon(folder), 100);
    }

    getNextAvailablePosition() {
        const gridSize = 100; // 80px icon + 20px gap
        const containerRect = this.desktopContent.getBoundingClientRect();
        const maxCols = Math.floor(containerRect.width / gridSize);
        const maxRows = Math.floor(containerRect.height / gridSize);
        
        const occupied = new Set();
        this.desktopContent.querySelectorAll('.desktop-icon').forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const col = Math.floor((rect.left - containerRect.left) / gridSize);
            const row = Math.floor((rect.top - containerRect.top) / gridSize);
            occupied.add(`${col},${row}`);
        });
        
        // Find first available position
        for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < maxCols; col++) {
                if (!occupied.has(`${col},${row}`)) {
                    return {
                        x: col * gridSize,
                        y: row * gridSize
                    };
                }
            }
        }
        
        // If no space found, place at random position
        return SystemUtils.getRandomPosition(containerRect.width, containerRect.height, 80, 100);
    }

    changeDesktopBackground() {
        const backgrounds = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
        ];
        
        const currentBg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        this.element.style.background = currentBg;
        
        SystemUtils.showNotification('Desktop', 'Desktop background changed');
    }

    cleanUpDesktop() {
        const icons = Array.from(this.desktopContent.querySelectorAll('.desktop-icon'));
        const gridSize = 100;
        let col = 0;
        let row = 0;
        
        icons.forEach(icon => {
            icon.style.position = 'absolute';
            icon.style.left = `${col * gridSize}px`;
            icon.style.top = `${row * gridSize}px`;
            
            col++;
            if (col * gridSize + 80 > this.desktopContent.offsetWidth) {
                col = 0;
                row++;
            }
        });
        
        SystemUtils.showNotification('Desktop', 'Desktop cleaned up');
    }

    sortIconsBy(criteria) {
        const icons = Array.from(this.desktopContent.querySelectorAll('.desktop-icon'));
        
        icons.sort((a, b) => {
            const aText = a.querySelector('.label').textContent.toLowerCase();
            const bText = b.querySelector('.label').textContent.toLowerCase();
            
            switch (criteria) {
                case 'name':
                    return aText.localeCompare(bText);
                case 'type':
                    return a.dataset.app.localeCompare(b.dataset.app);
                case 'date':
                    // For demo purposes, random order
                    return Math.random() - 0.5;
                default:
                    return 0;
            }
        });
        
        // Re-position icons
        const gridSize = 100;
        let col = 0;
        let row = 0;
        
        icons.forEach(icon => {
            icon.style.position = 'absolute';
            icon.style.left = `${col * gridSize}px`;
            icon.style.top = `${row * gridSize}px`;
            
            col++;
            if (col * gridSize + 80 > this.desktopContent.offsetWidth) {
                col = 0;
                row++;
            }
        });
        
        SystemUtils.showNotification('Desktop', `Icons sorted by ${criteria}`);
    }

    showViewOptions() {
        SystemUtils.showModal(
            'Desktop View Options',
            `
                <div style="margin: 16px 0;">
                    <h4>Icon Size</h4>
                    <input type="range" min="50" max="120" value="80" id="iconSize" style="width: 100%;">
                    
                    <h4 style="margin-top: 20px;">Grid Spacing</h4>
                    <input type="range" min="80" max="150" value="100" id="gridSpacing" style="width: 100%;">
                    
                    <h4 style="margin-top: 20px;">Options</h4>
                    <label style="display: block; margin: 8px 0;">
                        <input type="checkbox" id="showLabels" checked> Show icon labels
                    </label>
                    <label style="display: block; margin: 8px 0;">
                        <input type="checkbox" id="snapToGrid" checked> Snap to grid
                    </label>
                </div>
            `,
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Apply', primary: true, value: 'apply' }
            ]
        ).then(result => {
            if (result === 'apply') {
                this.applyViewOptions();
            }
        });
    }

    applyViewOptions() {
        const iconSize = document.getElementById('iconSize')?.value || 80;
        const showLabels = document.getElementById('showLabels')?.checked !== false;
        
        const style = document.createElement('style');
        style.id = 'desktop-view-options';
        
        // Remove existing custom styles
        const existing = document.getElementById('desktop-view-options');
        if (existing) existing.remove();
        
        style.textContent = `
            .desktop-icon .icon {
                font-size: ${iconSize * 0.6}px !important;
            }
            .desktop-icon {
                width: ${iconSize}px !important;
            }
            .desktop-icon .label {
                display: ${showLabels ? 'block' : 'none'} !important;
            }
        `;
        
        document.head.appendChild(style);
        SystemUtils.showNotification('Desktop', 'View options applied');
    }

    setupDragAndDrop() {
        // Basic drag and drop setup for future file operations
        this.element.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        this.element.addEventListener('drop', (e) => {
            e.preventDefault();
            // Handle file drops in the future
            SystemUtils.showNotification('Desktop', 'File operations not yet implemented');
        });
    }

    repositionIcons() {
        // Ensure icons stay within bounds on window resize
        const icons = this.desktopContent.querySelectorAll('.desktop-icon[style*="position: absolute"]');
        const containerRect = this.desktopContent.getBoundingClientRect();
        
        icons.forEach(icon => {
            const left = parseInt(icon.style.left) || 0;
            const top = parseInt(icon.style.top) || 0;
            
            const maxLeft = Math.max(0, containerRect.width - 80);
            const maxTop = Math.max(0, containerRect.height - 100);
            
            if (left > maxLeft) icon.style.left = `${maxLeft}px`;
            if (top > maxTop) icon.style.top = `${maxTop}px`;
        });
    }

    handleKeyboard(e) {
        if (this.selectedIcons.size === 0) return;
        
        switch (e.key) {
            case 'Enter':
                // Open selected icons
                this.selectedIcons.forEach(icon => {
                    this.handleIconDoubleClick(icon);
                });
                break;
                
            case 'Delete':
            case 'Backspace':
                // Move to trash
                this.selectedIcons.forEach(icon => {
                    this.moveToTrash(icon);
                });
                break;
                
            case 'F2':
                // Rename first selected icon
                const firstIcon = Array.from(this.selectedIcons)[0];
                if (firstIcon) this.renameIcon(firstIcon);
                break;
                
            case 'Escape':
                // Clear selection
                this.clearSelection();
                break;
                
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    // Select all
                    e.preventDefault();
                    const allIcons = this.desktopContent.querySelectorAll('.desktop-icon');
                    allIcons.forEach(icon => this.selectIcon(icon));
                }
                break;
        }
    }
}

// Initialize desktop
window.desktop = new Desktop();
