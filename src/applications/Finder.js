/**
 * Finder Application - File browser and manager (fully functional)
 */
class FinderApp {
    constructor() {
        this.appId = 'finder';
        this.windows = new Map();

        /* Map of appId → emoji used by the system */
        this.appIcons = {
            finder: '📁', terminal: '⚫', 'text-editor': '📝',
            calculator: '🧮', browser: '🌐', calendar: '📅',
            settings: '⚙️', folder: '📁', trash: '🗑️'
        };

        this.init();
    }

    /* ================================================================ */
    /*  Init & Launch                                                    */
    /* ================================================================ */

    init() {
        eventManager.on('app:launch', (data) => {
            if (data.appId === this.appId) this.launch(data);
        });

        eventManager.on('window:resize', (data) => this.handleWindowResize(data));

        eventManager.on('config:changed', (data) => {
            if (data.path && data.path.startsWith('fileSystem')) this.refreshOpenWindows();
        });
    }

    launch(options = {}) {
        const content = this.createFinderContent();

        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'Finder',
            content,
            { width: 900, height: 600, ...options }
        );

        const startPath = options.openPath || '/';

        this.windows.set(windowId, {
            currentPath: startPath,
            history: [startPath],
            historyIndex: 0,
            viewMode: 'list'
        });

        this.setupFinderWindow(windowId);
        return windowId;
    }

    /* ================================================================ */
    /*  HTML Template                                                    */
    /* ================================================================ */

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
                            <div class="sidebar-item" data-path="/Desktop">
                                <span class="sidebar-icon">🖥️</span>
                                <span class="sidebar-label">Desktop</span>
                            </div>
                            <div class="sidebar-item" data-path="/Documents">
                                <span class="sidebar-icon">📄</span>
                                <span class="sidebar-label">Documents</span>
                            </div>
                            <div class="sidebar-item" data-path="/Downloads">
                                <span class="sidebar-icon">📥</span>
                                <span class="sidebar-label">Downloads</span>
                            </div>
                            <div class="sidebar-item" data-path="/Pictures">
                                <span class="sidebar-icon">🖼️</span>
                                <span class="sidebar-label">Pictures</span>
                            </div>
                            <div class="sidebar-item" data-path="/Music">
                                <span class="sidebar-icon">🎵</span>
                                <span class="sidebar-label">Music</span>
                            </div>
                            <div class="sidebar-item" data-path="/Videos">
                                <span class="sidebar-icon">🎬</span>
                                <span class="sidebar-label">Videos</span>
                            </div>
                        </div>
                        <div class="sidebar-section">
                            <div class="sidebar-title">Devices</div>
                            <div class="sidebar-item" data-path="/">
                                <span class="sidebar-icon">💻</span>
                                <span class="sidebar-label">System</span>
                            </div>
                            <div class="sidebar-item" data-path="/Applications">
                                <span class="sidebar-icon">📱</span>
                                <span class="sidebar-label">Applications</span>
                            </div>
                        </div>
                    </div>
                    <div class="finder-main">
                        <div class="file-list" id="file-list"></div>
                    </div>
                </div>
                <div class="finder-statusbar">
                    <span class="status-text">Ready</span>
                    <span class="item-count">0 items</span>
                </div>
            </div>
            ${this._finderStyles()}
        `;
    }

    _finderStyles() {
        return `<style>
            .finder-window{height:100%;display:flex;flex-direction:column;background:rgba(255,255,255,0.95)}
            .finder-toolbar{display:flex;align-items:center;gap:16px;padding:8px 16px;background:rgba(240,240,240,0.8);border-bottom:1px solid rgba(0,0,0,0.1);flex-shrink:0}
            .finder-nav-buttons{display:flex;gap:4px}
            .nav-button,.view-button{width:32px;height:24px;border:1px solid rgba(0,0,0,0.2);background:rgba(255,255,255,0.8);border-radius:4px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;transition:all .2s ease}
            .nav-button:hover,.view-button:hover{background:rgba(255,255,255,1);border-color:rgba(0,0,0,0.3)}
            .nav-button:disabled{opacity:0.4;cursor:default}
            .view-button.active{background:#007AFF;color:#fff;border-color:#007AFF}
            .finder-path{display:flex;align-items:center;gap:4px;flex:1;font-size:13px;color:#666;overflow:hidden}
            .path-segment{padding:4px 8px;border-radius:4px;cursor:pointer;transition:background .2s;white-space:nowrap}
            .path-segment:hover{background:rgba(0,0,0,0.1)}
            .path-segment.active{background:rgba(0,122,255,0.1);color:#007AFF}
            .finder-search{min-width:180px}
            .search-input{width:100%;padding:6px 12px;border:1px solid rgba(0,0,0,0.2);border-radius:16px;background:rgba(255,255,255,0.9);font-size:13px;outline:none}
            .search-input:focus{border-color:#007AFF;box-shadow:0 0 0 2px rgba(0,122,255,0.2)}
            .finder-view-controls{display:flex;gap:2px}
            .finder-content{flex:1;display:flex;overflow:hidden}
            .finder-sidebar{width:180px;background:rgba(245,245,245,0.9);border-right:1px solid rgba(0,0,0,0.1);overflow-y:auto;flex-shrink:0}
            .sidebar-section{margin:8px 0}
            .sidebar-title{font-size:11px;font-weight:600;color:#666;text-transform:uppercase;padding:8px 16px 4px}
            .sidebar-item{display:flex;align-items:center;gap:8px;padding:6px 16px;cursor:pointer;font-size:13px;transition:background .2s}
            .sidebar-item:hover{background:rgba(0,0,0,0.1)}
            .sidebar-item.active{background:rgba(0,122,255,0.2);color:#007AFF}
            .sidebar-icon{font-size:16px;width:20px;text-align:center}
            .finder-main{flex:1;overflow:auto}
            .file-list{padding:16px}
            .file-list.grid-view{display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:12px}
            .file-item{display:flex;align-items:center;gap:12px;padding:8px;border-radius:6px;cursor:pointer;transition:background .2s;margin-bottom:2px}
            .file-item:hover{background:rgba(0,122,255,0.1)}
            .file-item.selected{background:rgba(0,122,255,0.2)}
            .file-icon{font-size:32px;width:40px;text-align:center;flex-shrink:0}
            .file-info{flex:1;min-width:0}
            .file-name{font-weight:500;font-size:14px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .file-details{font-size:12px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .file-list.grid-view .file-item{flex-direction:column;text-align:center;padding:12px 6px}
            .file-list.grid-view .file-icon{font-size:48px;width:auto;margin-bottom:4px}
            .file-list.grid-view .file-details{display:none}
            .finder-statusbar{display:flex;justify-content:space-between;align-items:center;padding:4px 16px;background:rgba(240,240,240,0.8);border-top:1px solid rgba(0,0,0,0.1);font-size:12px;color:#666;flex-shrink:0}
        </style>`;
    }

    /* ================================================================ */
    /*  Window Setup & Event Wiring                                      */
    /* ================================================================ */

    setupFinderWindow(windowId) {
        const win = windowManager.getWindow(windowId);
        if (!win) return;
        const el = win.element;
        const state = this.windows.get(windowId);

        // Navigation buttons
        el.querySelector('[data-action="back"]').addEventListener('click', () => this.navigateBack(windowId));
        el.querySelector('[data-action="forward"]').addEventListener('click', () => this.navigateForward(windowId));

        // Sidebar
        const sidebarItems = el.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                this.navigateToPath(windowId, item.dataset.path);
                sidebarItems.forEach(si => si.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // View controls
        const viewBtns = el.querySelectorAll('.view-button');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.viewMode = btn.dataset.view;
                this.loadDirectoryContents(windowId, state.currentPath);
            });
        });

        // Breadcrumb navigation (delegated)
        el.querySelector('.finder-path').addEventListener('click', (e) => {
            const seg = e.target.closest('.path-segment');
            if (seg && seg.dataset.path) {
                this.navigateToPath(windowId, seg.dataset.path);
            }
        });

        // Search
        const searchInput = el.querySelector('.search-input');
        searchInput.addEventListener('input', SystemUtils.debounce(() => {
            this.performSearch(windowId, searchInput.value);
        }, 300));

        // Clean up on window close
        eventManager.on('window:closed', (data) => {
            if (data.windowId === windowId) this.windows.delete(windowId);
        });

        // Navigate to start path
        this.navigateToPath(windowId, state.currentPath);

        // Highlight correct sidebar item
        this._highlightSidebar(el, state.currentPath);
    }

    _highlightSidebar(el, path) {
        const items = el.querySelectorAll('.sidebar-item');
        items.forEach(item => {
            item.classList.toggle('active', item.dataset.path === path);
        });
    }

    /* ================================================================ */
    /*  Navigation                                                       */
    /* ================================================================ */

    navigateToPath(windowId, path) {
        const state = this.windows.get(windowId);
        const win = windowManager.getWindow(windowId);
        if (!state || !win) return;

        state.currentPath = path;
        // Trim forward history
        state.history = state.history.slice(0, state.historyIndex + 1);
        state.history.push(path);
        state.historyIndex = state.history.length - 1;

        this.updatePathDisplay(win.element, path);
        this.loadDirectoryContents(windowId, path);
        this.updateNavigationButtons(win.element, state);
        this._highlightSidebar(win.element, path);
    }

    navigateBack(windowId) {
        const state = this.windows.get(windowId);
        const win = windowManager.getWindow(windowId);
        if (!state || !win || state.historyIndex <= 0) return;

        state.historyIndex--;
        state.currentPath = state.history[state.historyIndex];
        this.updatePathDisplay(win.element, state.currentPath);
        this.loadDirectoryContents(windowId, state.currentPath);
        this.updateNavigationButtons(win.element, state);
        this._highlightSidebar(win.element, state.currentPath);
    }

    navigateForward(windowId) {
        const state = this.windows.get(windowId);
        const win = windowManager.getWindow(windowId);
        if (!state || !win || state.historyIndex >= state.history.length - 1) return;

        state.historyIndex++;
        state.currentPath = state.history[state.historyIndex];
        this.updatePathDisplay(win.element, state.currentPath);
        this.loadDirectoryContents(windowId, state.currentPath);
        this.updateNavigationButtons(win.element, state);
        this._highlightSidebar(win.element, state.currentPath);
    }

    updatePathDisplay(el, path) {
        const pathContainer = el.querySelector('.finder-path');
        const parts = path.split('/').filter(Boolean);

        let html = `<span class="path-segment${parts.length === 0 ? ' active' : ''}" data-path="/">🏠 Home</span>`;
        parts.forEach((part, i) => {
            const fullPath = '/' + parts.slice(0, i + 1).join('/');
            html += `<span class="path-separator">›</span>`;
            html += `<span class="path-segment${i === parts.length - 1 ? ' active' : ''}" data-path="${fullPath}">${part}</span>`;
        });
        pathContainer.innerHTML = html;
    }

    updateNavigationButtons(el, state) {
        const back = el.querySelector('[data-action="back"]');
        const fwd  = el.querySelector('[data-action="forward"]');
        back.disabled = state.historyIndex <= 0;
        fwd.disabled  = state.historyIndex >= state.history.length - 1;
    }

    /* ================================================================ */
    /*  Directory Contents                                               */
    /* ================================================================ */

    loadDirectoryContents(windowId, path) {
        const win = windowManager.getWindow(windowId);
        if (!win) return;
        const el = win.element;
        const state = this.windows.get(windowId);
        const fileList = el.querySelector('#file-list');
        const statusText = el.querySelector('.status-text');
        const itemCount = el.querySelector('.item-count');

        statusText.textContent = 'Loading...';

        const files = this.getDirectoryContents(path);
        this.renderFileList(windowId, fileList, files, state.viewMode);

        statusText.textContent = path;
        itemCount.textContent = `${files.length} item${files.length !== 1 ? 's' : ''}`;
    }

    /**
     * Build file list for a given path, merging filesystem + live desktop state
     */
    getDirectoryContents(path) {
        const normalized = this._normalizePath(path);

        /* ---------- /Desktop: merge filesystem + actual DOM icons ---------- */
        if (normalized === '/Desktop' || normalized === '/desktop') {
            return this._getDesktopContents();
        }

        /* ---------- /Applications: live from system apps ---------- */
        if (normalized === '/Applications' || normalized === '/applications') {
            return this._getApplicationsContents();
        }

        /* ---------- Everything else: read from configManager ---------- */
        return this._getFilesystemContents(normalized);
    }

    _normalizePath(p) {
        // Capitalize first letter of each segment to match configManager keys
        let parts = p.split('/').filter(Boolean);
        if (parts.length === 0) return '/';
        // Keep casing as-is but try capitalized if not found
        return '/' + parts.join('/');
    }

    /**
     * Desktop folder — reads actual desktop-content DOM and merges with FS
     */
    _getDesktopContents() {
        const files = [];
        const seen = new Set();

        // Read actual desktop icons from DOM
        const desktopContent = document.getElementById('desktop-content');
        if (desktopContent) {
            desktopContent.querySelectorAll('.desktop-icon').forEach(icon => {
                const appId = icon.dataset.app;
                const label = icon.querySelector('.label');
                const iconEl = icon.querySelector('.icon');
                if (!label) return;
                const name = label.textContent;
                const emoji = iconEl ? iconEl.textContent.trim() : '📄';

                if (appId === 'folder') {
                    files.push({
                        name,
                        type: 'folder',
                        icon: '📁',
                        size: '--',
                        modified: 'Today',
                        path: `/Desktop/${name}`
                    });
                } else {
                    files.push({
                        name,
                        type: 'app',
                        appId,
                        icon: emoji,
                        size: '--',
                        modified: 'Today',
                        path: `/Desktop/${name}`
                    });
                }
                seen.add(name);
            });
        }

        // Also include any filesystem children of /Desktop not already in DOM
        if (typeof configManager !== 'undefined') {
            const desktopFS = configManager.getFile('/Desktop') || configManager.getFile('/desktop');
            if (desktopFS && desktopFS.children) {
                for (const [key, item] of Object.entries(desktopFS.children)) {
                    if (seen.has(item.name)) continue;
                    files.push({
                        name: item.name,
                        type: item.type,
                        icon: item.type === 'folder' ? '📁' : this.getFileIcon(item.name),
                        size: item.type === 'folder' ? '--' : this.formatFileSize(item.size || 0),
                        modified: item.modified ? new Date(item.modified).toLocaleDateString() : 'Today',
                        path: `/Desktop/${key}`
                    });
                }
            }
        }

        files.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        return files;
    }

    /**
     * Applications folder — reflect registered system apps
     */
    _getApplicationsContents() {
        const apps = [
            { name: 'Finder',    appId: 'finder',      icon: '📁' },
            { name: 'Terminal',   appId: 'terminal',    icon: '⚫' },
            { name: 'TextEdit',   appId: 'text-editor', icon: '📝' },
            { name: 'Calculator', appId: 'calculator',  icon: '🧮' },
            { name: 'Browser',    appId: 'browser',     icon: '🌐' },
            { name: 'Calendar',   appId: 'calendar',    icon: '📅' },
            { name: 'Settings',   appId: 'settings',    icon: '⚙️' },
        ];
        return apps.map(a => ({
            name: a.name,
            type: 'app',
            appId: a.appId,
            icon: a.icon,
            size: 'Application',
            modified: '--',
            path: `/Applications/${a.name}`
        }));
    }

    /**
     * Generic filesystem path — reads from configManager
     */
    _getFilesystemContents(path) {
        if (typeof configManager === 'undefined') {
            return this._getFallbackRoot(path);
        }

        // Try exact path first, then capitalized first letter
        let folder = configManager.getFile(path);
        if (!folder) {
            const parts = path.split('/').filter(Boolean);
            const capitalized = '/' + parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('/');
            folder = configManager.getFile(capitalized);
        }

        if (!folder || folder.type !== 'folder') {
            // If root, return top-level folders
            if (path === '/') return this._getFallbackRoot(path);
            return [];
        }

        const files = [];
        if (folder.children) {
            for (const [key, item] of Object.entries(folder.children)) {
                files.push({
                    name: item.name || key,
                    type: item.type,
                    icon: item.type === 'folder' ? '📁' : this.getFileIcon(item.name || key),
                    size: item.type === 'folder' ? '--' : this.formatFileSize(item.size || 0),
                    modified: item.modified ? new Date(item.modified).toLocaleDateString() : 'Unknown',
                    path: path === '/' ? `/${key}` : `${path}/${key}`,
                    content: item.content,
                    created: item.created
                });
            }
        }

        files.sort((a, b) => {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
            return a.name.localeCompare(b.name);
        });
        return files;
    }

    _getFallbackRoot(path) {
        if (path !== '/') return [];
        return [
            { name: 'Applications', type: 'folder', icon: '📱', size: '--', modified: 'Today', path: '/Applications' },
            { name: 'Desktop',      type: 'folder', icon: '🖥️', size: '--', modified: 'Today', path: '/Desktop' },
            { name: 'Documents',    type: 'folder', icon: '📄', size: '--', modified: 'Today', path: '/Documents' },
            { name: 'Downloads',    type: 'folder', icon: '📥', size: '--', modified: 'Today', path: '/Downloads' },
            { name: 'Music',        type: 'folder', icon: '🎵', size: '--', modified: 'Today', path: '/Music' },
            { name: 'Pictures',     type: 'folder', icon: '🖼️', size: '--', modified: 'Today', path: '/Pictures' },
            { name: 'Videos',       type: 'folder', icon: '🎬', size: '--', modified: 'Today', path: '/Videos' },
        ];
    }

    /* ================================================================ */
    /*  Rendering                                                        */
    /* ================================================================ */

    renderFileList(windowId, container, files, viewMode) {
        container.className = 'file-list' + (viewMode === 'grid' ? ' grid-view' : '');

        if (files.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <div style="font-size:48px;margin-bottom:16px;">📂</div>
                    <div>This folder is empty</div>
                </div>`;
            return;
        }

        container.innerHTML = files.map(f => `
            <div class="file-item"
                 data-type="${f.type}"
                 data-name="${this._escapeAttr(f.name)}"
                 data-path="${this._escapeAttr(f.path || '')}"
                 data-app-id="${f.appId || ''}">
                <div class="file-icon">${f.icon}</div>
                <div class="file-info">
                    <div class="file-name">${this._escapeHtml(f.name)}</div>
                    <div class="file-details">${f.size} • ${f.modified}</div>
                </div>
            </div>
        `).join('');

        // Event handlers
        container.querySelectorAll('.file-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleFileClick(item, e));
            item.addEventListener('dblclick', () => this.handleFileDoubleClick(windowId, item));
        });
    }

    handleFileClick(fileItem, event) {
        if (!event.ctrlKey && !event.metaKey) {
            fileItem.parentElement.querySelectorAll('.file-item.selected').forEach(i => i.classList.remove('selected'));
        }
        fileItem.classList.toggle('selected');
    }

    handleFileDoubleClick(windowId, fileItem) {
        const type   = fileItem.dataset.type;
        const name   = fileItem.dataset.name;
        const path   = fileItem.dataset.path;
        const appId  = fileItem.dataset.appId;

        if (type === 'folder') {
            // Navigate into this folder
            this.navigateToPath(windowId, path);
            return;
        }

        if (type === 'app' && appId) {
            // Launch the application
            eventManager.emit('app:launch', { appId, title: name });
            return;
        }

        // It's a file — try to open in TextEdit
        if (typeof configManager !== 'undefined') {
            const file = configManager.getFile(path);
            if (file && file.content !== undefined) {
                eventManager.emit('app:launch', {
                    appId: 'text-editor',
                    title: name,
                    content: file.content,
                    filePath: path
                });
                return;
            }
        }

        SystemUtils.showNotification('Finder', `Opened "${name}"`);
    }

    /* ================================================================ */
    /*  Search - recursive through real filesystem                       */
    /* ================================================================ */

    performSearch(windowId, query) {
        const win = windowManager.getWindow(windowId);
        if (!win) return;
        const state = this.windows.get(windowId);

        if (!query.trim()) {
            this.loadDirectoryContents(windowId, state.currentPath);
            return;
        }

        const el = win.element;
        const statusText = el.querySelector('.status-text');
        const itemCount  = el.querySelector('.item-count');
        statusText.textContent = `Searching for "${query}"...`;

        const results = [];
        const q = query.toLowerCase();

        // Search desktop DOM
        const desktopItems = this._getDesktopContents();
        desktopItems.forEach(f => {
            if (f.name.toLowerCase().includes(q)) results.push(f);
        });

        // Search applications
        const apps = this._getApplicationsContents();
        apps.forEach(f => {
            if (f.name.toLowerCase().includes(q)) results.push(f);
        });

        // Recursive filesystem search
        if (typeof configManager !== 'undefined') {
            this._searchFS(configManager.getFile('/'), '/', q, results, new Set());
        }

        // De-duplicate by path
        const seen = new Set();
        const unique = results.filter(f => {
            if (seen.has(f.path)) return false;
            seen.add(f.path);
            return true;
        });

        const fileList = el.querySelector('#file-list');
        this.renderFileList(windowId, fileList, unique, state.viewMode);
        statusText.textContent = `Results for "${query}"`;
        itemCount.textContent = `${unique.length} item${unique.length !== 1 ? 's' : ''}`;
    }

    _searchFS(node, currentPath, query, results, visited) {
        if (!node || !node.children || visited.has(currentPath)) return;
        visited.add(currentPath);

        for (const [key, item] of Object.entries(node.children)) {
            const itemPath = currentPath === '/' ? `/${key}` : `${currentPath}/${key}`;
            if ((item.name || key).toLowerCase().includes(query)) {
                results.push({
                    name: item.name || key,
                    type: item.type,
                    icon: item.type === 'folder' ? '📁' : this.getFileIcon(item.name || key),
                    size: item.type === 'folder' ? '--' : this.formatFileSize(item.size || 0),
                    modified: item.modified ? new Date(item.modified).toLocaleDateString() : 'Unknown',
                    path: itemPath
                });
            }
            if (item.type === 'folder') {
                this._searchFS(item, itemPath, query, results, visited);
            }
        }
    }

    /* ================================================================ */
    /*  View toggle                                                      */
    /* ================================================================ */

    changeView(windowId, viewType) {
        const state = this.windows.get(windowId);
        if (state) {
            state.viewMode = viewType;
            this.loadDirectoryContents(windowId, state.currentPath);
        }
    }

    /* ================================================================ */
    /*  Responsive resize                                                */
    /* ================================================================ */

    handleWindowResize(data) {
        if (!this.windows.has(data.windowId)) return;
        const win = windowManager.getWindow(data.windowId);
        if (!win) return;

        const sidebar = win.element.querySelector('.finder-sidebar');
        if (sidebar) {
            sidebar.style.display = data.width < 500 ? 'none' : '';
        }
    }

    /* ================================================================ */
    /*  Helpers                                                          */
    /* ================================================================ */

    refreshOpenWindows() {
        this.windows.forEach((state, windowId) => {
            this.loadDirectoryContents(windowId, state.currentPath);
        });
    }

    getFileIcon(filename) {
        const ext = (filename || '').split('.').pop()?.toLowerCase();
        const map = {
            txt:'📄',md:'📝',js:'📜',html:'🌐',css:'🎨',json:'⚙️',
            jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',
            mp3:'🎵',wav:'🎵',mp4:'🎬',avi:'🎬',
            pdf:'📕',zip:'🗜️',rar:'🗜️'
        };
        return map[ext] || '📄';
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B','KB','MB','GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    _escapeHtml(s) {
        return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    _escapeAttr(s) {
        return (s || '').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    /**
     * Create new folder in current directory (used by context menu inside Finder)
     */
    createNewFolder(windowId, folderName = 'New Folder') {
        const state = this.windows.get(windowId);
        if (!state || typeof configManager === 'undefined') return;

        let finalName = folderName;
        let counter = 1;
        while (configManager.getFile(`${state.currentPath}/${finalName}`)) {
            finalName = `${folderName} ${counter++}`;
        }

        if (configManager.createFile(state.currentPath, finalName, 'folder')) {
            this.loadDirectoryContents(windowId, state.currentPath);
        }
    }

    /**
     * Create new file in current directory
     */
    createNewFile(windowId, fileName = 'Untitled.txt', content = '') {
        const state = this.windows.get(windowId);
        if (!state || typeof configManager === 'undefined') return;

        let finalName = fileName;
        let counter = 1;
        const base = fileName.split('.')[0];
        const ext = fileName.includes('.') ? '.' + fileName.split('.').pop() : '';
        while (configManager.getFile(`${state.currentPath}/${finalName}`)) {
            finalName = `${base} ${counter++}${ext}`;
        }

        if (configManager.createFile(state.currentPath, finalName, 'file', content)) {
            this.loadDirectoryContents(windowId, state.currentPath);
        }
    }
}

// Initialize Finder app
window.finderApp = new FinderApp();
