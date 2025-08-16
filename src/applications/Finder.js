/**
 * Finder Application - File browser and manager
 */
class FinderApp {
    constructor() {
        this.appId = 'finder';
        this.windows = new Map();
        
        this.init();
    }

    init() {
        // Listen for app launch events
        eventManager.on('app:launch', (data) => {
            if (data.appId === this.appId) {
                this.launch(data);
            }
        });

        // Listen for window resize events to make content responsive
        eventManager.on('window:resize', (data) => {
            this.handleWindowResize(data);
        });

        // Listen for config changes to update file system
        eventManager.on('config:changed', (data) => {
            if (data.path.startsWith('fileSystem')) {
                this.refreshOpenWindows();
            }
        });
    }

    launch(options = {}) {
        const content = this.createFinderContent();
        
        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'Finder',
            content,
            {
                width: 900,
                height: 600,
                ...options
            }
        );

        this.windows.set(windowId, {
            currentPath: '/',
            history: ['/'],
            historyIndex: 0
        });

        this.setupFinderWindow(windowId);
        return windowId;
    }

    createFinderContent() {
        return `
            <div class="finder-window">
                <div class="finder-toolbar">
                    <div class="finder-nav-buttons">
                        <button class="nav-button" data-action="back" title="Back">◀</button>
                        <button class="nav-button" data-action="forward" title="Forward">▶</button>
                    </div>
                    <div class="finder-path">
                        <span class="path-segment" data-path="/">🏠</span>
                        <span class="path-separator">›</span>
                        <span class="path-segment active" data-path="/">Home</span>
                    </div>
                    <div class="finder-search">
                        <input type="text" placeholder="Search" class="search-input">
                    </div>
                    <div class="finder-view-controls">
                        <button class="view-button active" data-view="list" title="List View">☰</button>
                        <button class="view-button" data-view="grid" title="Grid View">▦</button>
                    </div>
                </div>
                
                <div class="finder-content">
                    <div class="finder-sidebar">
                        <div class="sidebar-section">
                            <div class="sidebar-title">Favorites</div>
                            <div class="sidebar-item" data-path="/desktop">
                                <span class="sidebar-icon">🖥️</span>
                                <span class="sidebar-label">Desktop</span>
                            </div>
                            <div class="sidebar-item" data-path="/documents">
                                <span class="sidebar-icon">📄</span>
                                <span class="sidebar-label">Documents</span>
                            </div>
                            <div class="sidebar-item" data-path="/downloads">
                                <span class="sidebar-icon">📥</span>
                                <span class="sidebar-label">Downloads</span>
                            </div>
                            <div class="sidebar-item" data-path="/pictures">
                                <span class="sidebar-icon">🖼️</span>
                                <span class="sidebar-label">Pictures</span>
                            </div>
                            <div class="sidebar-item" data-path="/music">
                                <span class="sidebar-icon">🎵</span>
                                <span class="sidebar-label">Music</span>
                            </div>
                            <div class="sidebar-item" data-path="/videos">
                                <span class="sidebar-icon">🎬</span>
                                <span class="sidebar-label">Videos</span>
                            </div>
                        </div>
                        
                        <div class="sidebar-section">
                            <div class="sidebar-title">Devices</div>
                            <div class="sidebar-item" data-path="/system">
                                <span class="sidebar-icon">💻</span>
                                <span class="sidebar-label">System</span>
                            </div>
                            <div class="sidebar-item" data-path="/applications">
                                <span class="sidebar-icon">📱</span>
                                <span class="sidebar-label">Applications</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="finder-main">
                        <div class="file-list" id="file-list">
                            <!-- Files will be populated here -->
                        </div>
                    </div>
                </div>
                
                <div class="finder-statusbar">
                    <span class="status-text">Ready</span>
                    <span class="item-count">0 items</span>
                </div>
            </div>
            
            <style>
                .finder-window {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: rgba(255, 255, 255, 0.95);
                }
                
                .finder-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 8px 16px;
                    background: rgba(240, 240, 240, 0.8);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    flex-shrink: 0;
                }
                
                .finder-nav-buttons {
                    display: flex;
                    gap: 4px;
                }
                
                .nav-button, .view-button {
                    width: 32px;
                    height: 24px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    transition: all 0.2s ease;
                }
                
                .nav-button:hover, .view-button:hover {
                    background: rgba(255, 255, 255, 1);
                    border-color: rgba(0, 0, 0, 0.3);
                }
                
                .view-button.active {
                    background: #007AFF;
                    color: white;
                    border-color: #007AFF;
                }
                
                .finder-path {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    flex: 1;
                    font-size: 13px;
                    color: #666;
                }
                
                .path-segment {
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                }
                
                .path-segment:hover {
                    background: rgba(0, 0, 0, 0.1);
                }
                
                .path-segment.active {
                    background: rgba(0, 122, 255, 0.1);
                    color: #007AFF;
                }
                
                .finder-search {
                    min-width: 200px;
                }
                
                .search-input {
                    width: 100%;
                    padding: 6px 12px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 16px;
                    background: rgba(255, 255, 255, 0.9);
                    font-size: 13px;
                    outline: none;
                }
                
                .search-input:focus {
                    border-color: #007AFF;
                    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
                }
                
                .finder-view-controls {
                    display: flex;
                    gap: 2px;
                }
                
                .finder-content {
                    flex: 1;
                    display: flex;
                    overflow: hidden;
                }
                
                .finder-sidebar {
                    width: 180px;
                    background: rgba(245, 245, 245, 0.9);
                    border-right: 1px solid rgba(0, 0, 0, 0.1);
                    overflow-y: auto;
                    flex-shrink: 0;
                }
                
                .sidebar-section {
                    margin: 8px 0;
                }
                
                .sidebar-title {
                    font-size: 11px;
                    font-weight: 600;
                    color: #666;
                    text-transform: uppercase;
                    padding: 8px 16px 4px;
                }
                
                .sidebar-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 16px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: background-color 0.2s ease;
                }
                
                .sidebar-item:hover {
                    background: rgba(0, 0, 0, 0.1);
                }
                
                .sidebar-item.active {
                    background: rgba(0, 122, 255, 0.2);
                    color: #007AFF;
                }
                
                .sidebar-icon {
                    font-size: 16px;
                    width: 20px;
                    text-align: center;
                }
                
                .finder-main {
                    flex: 1;
                    overflow: auto;
                }
                
                .file-list {
                    padding: 16px;
                }
                
                .file-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background-color 0.2s ease;
                    margin-bottom: 2px;
                }
                
                .file-item:hover {
                    background: rgba(0, 122, 255, 0.1);
                }
                
                .file-item.selected {
                    background: rgba(0, 122, 255, 0.2);
                }
                
                .file-icon {
                    font-size: 32px;
                    width: 40px;
                    text-align: center;
                    flex-shrink: 0;
                }
                
                .file-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .file-name {
                    font-weight: 500;
                    font-size: 14px;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .file-details {
                    font-size: 12px;
                    color: #666;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .finder-statusbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 4px 16px;
                    background: rgba(240, 240, 240, 0.8);
                    border-top: 1px solid rgba(0, 0, 0, 0.1);
                    font-size: 12px;
                    color: #666;
                    flex-shrink: 0;
                }
            </style>
        `;
    }

    setupFinderWindow(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const windowData = this.windows.get(windowId);
        
        // Navigation buttons
        const backButton = windowElement.querySelector('[data-action="back"]');
        const forwardButton = windowElement.querySelector('[data-action="forward"]');
        
        backButton.addEventListener('click', () => this.navigateBack(windowId));
        forwardButton.addEventListener('click', () => this.navigateForward(windowId));
        
        // Sidebar navigation
        const sidebarItems = windowElement.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                const path = item.dataset.path;
                this.navigateToPath(windowId, path);
                
                // Update active sidebar item
                sidebarItems.forEach(si => si.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // View controls
        const viewButtons = windowElement.querySelectorAll('.view-button');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                this.changeView(windowId, view);
                
                viewButtons.forEach(vb => vb.classList.remove('active'));
                button.classList.add('active');
            });
        });
        
        // Search
        const searchInput = windowElement.querySelector('.search-input');
        searchInput.addEventListener('input', SystemUtils.debounce(() => {
            this.performSearch(windowId, searchInput.value);
        }, 300));
        
        // Load initial content
        this.navigateToPath(windowId, '/');
    }

    navigateToPath(windowId, path) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        
        windowData.currentPath = path;
        windowData.history = windowData.history.slice(0, windowData.historyIndex + 1);
        windowData.history.push(path);
        windowData.historyIndex = windowData.history.length - 1;
        
        this.updatePathDisplay(windowElement, path);
        this.loadDirectoryContents(windowId, path);
        this.updateNavigationButtons(windowElement, windowData);
    }

    navigateBack(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        
        if (windowData.historyIndex > 0) {
            windowData.historyIndex--;
            const path = windowData.history[windowData.historyIndex];
            windowData.currentPath = path;
            
            this.updatePathDisplay(windowElement, path);
            this.loadDirectoryContents(windowId, path);
            this.updateNavigationButtons(windowElement, windowData);
        }
    }

    navigateForward(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        
        if (windowData.historyIndex < windowData.history.length - 1) {
            windowData.historyIndex++;
            const path = windowData.history[windowData.historyIndex];
            windowData.currentPath = path;
            
            this.updatePathDisplay(windowElement, path);
            this.loadDirectoryContents(windowId, path);
            this.updateNavigationButtons(windowElement, windowData);
        }
    }

    updatePathDisplay(windowElement, path) {
        const pathContainer = windowElement.querySelector('.finder-path');
        const pathParts = path.split('/').filter(part => part !== '');
        
        if (pathParts.length === 0) pathParts.push('Home');
        
        pathContainer.innerHTML = `
            <span class="path-segment" data-path="/">🏠</span>
            ${pathParts.map((part, index) => {
                const fullPath = '/' + pathParts.slice(0, index + 1).join('/');
                return `
                    <span class="path-separator">›</span>
                    <span class="path-segment ${index === pathParts.length - 1 ? 'active' : ''}" 
                          data-path="${fullPath}">${part}</span>
                `;
            }).join('')}
        `;
    }

    updateNavigationButtons(windowElement, windowData) {
        const backButton = windowElement.querySelector('[data-action="back"]');
        const forwardButton = windowElement.querySelector('[data-action="forward"]');
        
        backButton.disabled = windowData.historyIndex <= 0;
        forwardButton.disabled = windowData.historyIndex >= windowData.history.length - 1;
        
        backButton.style.opacity = backButton.disabled ? '0.5' : '1';
        forwardButton.style.opacity = forwardButton.disabled ? '0.5' : '1';
    }

    loadDirectoryContents(windowId, path) {
        const windowElement = windowManager.getWindow(windowId).element;
        const fileList = windowElement.querySelector('#file-list');
        const statusText = windowElement.querySelector('.status-text');
        const itemCount = windowElement.querySelector('.item-count');
        
        // Show loading
        statusText.textContent = 'Loading...';
        fileList.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Loading...</div>';
        
        // Load from persistent file system
        setTimeout(() => {
            const files = this.getDirectoryContents(path);
            this.renderFileList(fileList, files);
            
            statusText.textContent = 'Ready';
            itemCount.textContent = `${files.length} items`;
        }, 100); // Reduced delay since we're not simulating network
    }

    getDirectoryContents(path) {
        // Use persistent file system from config
        if (typeof configManager === 'undefined') {
            console.warn('ConfigManager not available, using fallback data');
            return this.getFallbackDirectoryContents(path);
        }

        const folder = configManager.getFile(path);
        if (!folder || folder.type !== 'folder') {
            return [];
        }

        const files = [];
        if (folder.children) {
            for (const [name, item] of Object.entries(folder.children)) {
                files.push({
                    name: item.name,
                    type: item.type,
                    icon: item.type === 'folder' ? '📁' : this.getFileIcon(item.name),
                    size: item.type === 'folder' ? '--' : this.formatFileSize(item.size || 0),
                    modified: item.modified ? new Date(item.modified).toLocaleDateString() : 'Unknown',
                    path: path === '/' ? `/${name}` : `${path}/${name}`,
                    created: item.created,
                    content: item.content
                });
            }
        }

        // Sort files (folders first, then by name)
        files.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });

        return files;
    }

    /**
     * Get appropriate icon for file type
     */
    getFileIcon(filename) {
        const extension = filename.split('.').pop()?.toLowerCase();
        const iconMap = {
            'txt': '📄',
            'md': '📝',
            'js': '📜',
            'html': '🌐',
            'css': '🎨',
            'json': '⚙️',
            'jpg': '🖼️',
            'jpeg': '🖼️',
            'png': '🖼️',
            'gif': '🖼️',
            'mp3': '🎵',
            'wav': '🎵',
            'mp4': '🎬',
            'avi': '🎬',
            'pdf': '📕',
            'zip': '🗜️',
            'rar': '🗜️'
        };
        return iconMap[extension] || '📄';
    }

    /**
     * Format file size for display
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * Fallback directory contents when config is not available
     */
    getFallbackDirectoryContents(path) {
        // Mock file system data
        const mockFiles = {
            '/': [
                { name: 'Applications', type: 'folder', icon: '📱', size: '--', modified: 'Today' },
                { name: 'Desktop', type: 'folder', icon: '🖥️', size: '--', modified: 'Today' },
                { name: 'Documents', type: 'folder', icon: '📄', size: '--', modified: 'Yesterday' },
                { name: 'Downloads', type: 'folder', icon: '📥', size: '--', modified: '2 days ago' },
                { name: 'Pictures', type: 'folder', icon: '🖼️', size: '--', modified: 'Last week' },
                { name: 'Music', type: 'folder', icon: '🎵', size: '--', modified: 'Last week' },
                { name: 'Videos', type: 'folder', icon: '🎬', size: '--', modified: 'Last month' }
            ],
            '/documents': [
                { name: 'Resume.pdf', type: 'pdf', icon: '📄', size: '245 KB', modified: 'Today' },
                { name: 'Report.docx', type: 'document', icon: '📝', size: '1.2 MB', modified: 'Yesterday' },
                { name: 'Spreadsheet.xlsx', type: 'spreadsheet', icon: '📊', size: '567 KB', modified: '3 days ago' }
            ],
            '/pictures': [
                { name: 'Vacation.jpg', type: 'image', icon: '🖼️', size: '2.1 MB', modified: 'Last week' },
                { name: 'Family.png', type: 'image', icon: '🖼️', size: '1.8 MB', modified: 'Last week' },
                { name: 'Screenshot.png', type: 'image', icon: '🖼️', size: '456 KB', modified: 'Today' }
            ],
            '/music': [
                { name: 'Playlist.m3u', type: 'playlist', icon: '🎵', size: '12 KB', modified: 'Last month' },
                { name: 'Song.mp3', type: 'audio', icon: '🎵', size: '4.2 MB', modified: 'Last month' }
            ]
        };
        
        return mockFiles[path] || [
            { name: 'Empty folder', type: 'info', icon: '📂', size: '--', modified: '--' }
        ];
    }

    renderFileList(container, files) {
        if (files.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">📂</div>
                    <div>This folder is empty</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = files.map(file => `
            <div class="file-item" data-type="${file.type}" data-name="${file.name}">
                <div class="file-icon">${file.icon}</div>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-details">${file.size} • ${file.modified}</div>
                </div>
            </div>
        `).join('');
        
        // Add click handlers
        const fileItems = container.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleFileClick(item, e));
            item.addEventListener('dblclick', () => this.handleFileDoubleClick(item));
        });
    }

    handleFileClick(fileItem, event) {
        if (!event.ctrlKey && !event.metaKey) {
            // Clear other selections
            const container = fileItem.parentElement;
            container.querySelectorAll('.file-item.selected').forEach(item => {
                item.classList.remove('selected');
            });
        }
        
        fileItem.classList.toggle('selected');
    }

    handleFileDoubleClick(fileItem) {
        const fileName = fileItem.dataset.name;
        const fileType = fileItem.dataset.type;
        
        if (fileType === 'folder') {
            // Navigate to folder (this would need the full path)
            SystemUtils.showNotification('Finder', `Opening ${fileName}...`);
        } else {
            // Open file with appropriate application
            SystemUtils.showNotification('Finder', `Opening ${fileName}...`);
        }
    }

    changeView(windowId, viewType) {
        const windowElement = windowManager.getWindow(windowId).element;
        const fileList = windowElement.querySelector('#file-list');
        
        if (viewType === 'grid') {
            fileList.style.display = 'grid';
            fileList.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
            fileList.style.gap = '16px';
            
            const fileItems = fileList.querySelectorAll('.file-item');
            fileItems.forEach(item => {
                item.style.flexDirection = 'column';
                item.style.textAlign = 'center';
                item.style.padding = '16px 8px';
                
                const icon = item.querySelector('.file-icon');
                icon.style.fontSize = '48px';
                icon.style.marginBottom = '8px';
                
                const details = item.querySelector('.file-details');
                details.style.display = 'none';
            });
        } else {
            // List view (default)
            fileList.style.display = 'block';
            fileList.style.gridTemplateColumns = '';
            fileList.style.gap = '';
            
            const fileItems = fileList.querySelectorAll('.file-item');
            fileItems.forEach(item => {
                item.style.flexDirection = 'row';
                item.style.textAlign = 'left';
                item.style.padding = '8px';
                
                const icon = item.querySelector('.file-icon');
                icon.style.fontSize = '32px';
                icon.style.marginBottom = '0';
                
                const details = item.querySelector('.file-details');
                details.style.display = 'block';
            });
        }
        
        SystemUtils.showNotification('Finder', `Switched to ${viewType} view`);
    }

    performSearch(windowId, query) {
        if (!query.trim()) {
            // Reload current directory
            const windowData = this.windows.get(windowId);
            this.loadDirectoryContents(windowId, windowData.currentPath);
            return;
        }
        
        const windowElement = windowManager.getWindow(windowId).element;
        const statusText = windowElement.querySelector('.status-text');
        
        statusText.textContent = `Searching for "${query}"...`;
        
        // Mock search results
        setTimeout(() => {
            const searchResults = [
                { name: `${query}-result.txt`, type: 'document', icon: '📄', size: '1.2 KB', modified: 'Today' },
                { name: `Another ${query} file.pdf`, type: 'pdf', icon: '📄', size: '245 KB', modified: 'Yesterday' }
            ];
            
            const fileList = windowElement.querySelector('#file-list');
            this.renderFileList(fileList, searchResults);
            
            statusText.textContent = `Found ${searchResults.length} results for "${query}"`;
            
            const itemCount = windowElement.querySelector('.item-count');
            itemCount.textContent = `${searchResults.length} items`;
        }, 500);
    }

    /**
     * Handle window resize to make content responsive
     * @param {Object} data - Resize event data
     */
    handleWindowResize(data) {
        // Check if this resize event is for one of our windows
        const windowIds = Array.from(this.windows.keys());
        if (!windowIds.includes(data.windowId)) return;

        const windowElement = windowManager.getWindow(data.windowId).element;
        if (!windowElement) return;

        // Update file list layout for responsive behavior
        const fileList = windowElement.querySelector('#file-list');
        if (fileList) {
            // Trigger reflow for responsive grid layout
            fileList.style.display = 'grid';
        }

        // Update sidebar if window gets too narrow
        const sidebar = windowElement.querySelector('.finder-sidebar');
        const content = windowElement.querySelector('.finder-content');
        
        if (sidebar && content && data.width < 600) {
            // Hide sidebar on narrow windows
            sidebar.style.display = 'none';
            content.style.marginLeft = '0';
        } else if (sidebar && content) {
            // Show sidebar on wider windows
            sidebar.style.display = 'flex';
            content.style.marginLeft = '200px';
        }
    }

    /**
     * Refresh all open Finder windows
     */
    refreshOpenWindows() {
        this.windows.forEach((windowData, windowId) => {
            this.loadDirectoryContents(windowId, windowData.currentPath);
        });
    }

    /**
     * Create new folder in current directory
     */
    createNewFolder(windowId, folderName = 'New Folder') {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        let finalName = folderName;
        let counter = 1;
        
        // Find unique name
        while (configManager.getFile(`${windowData.currentPath}/${finalName}`)) {
            finalName = `${folderName} ${counter}`;
            counter++;
        }

        // Create folder in persistent storage
        if (configManager.createFile(windowData.currentPath, finalName, 'folder')) {
            this.loadDirectoryContents(windowId, windowData.currentPath);
            
            // Show success message
            const windowElement = windowManager.getWindow(windowId).element;
            const statusText = windowElement.querySelector('.status-text');
            statusText.textContent = `Created folder "${finalName}"`;
            
            setTimeout(() => {
                statusText.textContent = 'Ready';
            }, 2000);
        }
    }

    /**
     * Create new file in current directory
     */
    createNewFile(windowId, fileName = 'Untitled.txt', content = '') {
        const windowData = this.windows.get(windowId);
        if (!windowData) return;

        let finalName = fileName;
        let counter = 1;
        const baseName = fileName.split('.')[0];
        const extension = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
        
        // Find unique name
        while (configManager.getFile(`${windowData.currentPath}/${finalName}`)) {
            finalName = `${baseName} ${counter}${extension}`;
            counter++;
        }

        // Create file in persistent storage
        if (configManager.createFile(windowData.currentPath, finalName, 'file', content)) {
            this.loadDirectoryContents(windowId, windowData.currentPath);
            
            // Show success message
            const windowElement = windowManager.getWindow(windowId).element;
            const statusText = windowElement.querySelector('.status-text');
            statusText.textContent = `Created file "${finalName}"`;
            
            setTimeout(() => {
                statusText.textContent = 'Ready';
            }, 2000);
        }
    }
}

// Initialize Finder app
window.finderApp = new FinderApp();
