/**
 * Text Editor Application - Simple text editor
 */
class TextEditorApp {
    constructor() {
        this.appId = 'text-editor';
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

        // Listen for config changes to apply app settings
        eventManager.on('config:apply-app-settings', (appSettings) => {
            if (appSettings.textEditor) {
                this.applySettings(appSettings.textEditor);
            }
        });
    }

    launch(options = {}) {
        const content = this.createEditorContent();
        
        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'TextEdit',
            content,
            {
                width: 800,
                height: 600,
                ...options
            }
        );

        this.windows.set(windowId, {
            filename: null,
            modified: false,
            content: ''
        });

        this.setupEditorWindow(windowId);
        return windowId;
    }

    createEditorContent() {
        return `
            <div class="editor-window">
                <div class="editor-toolbar">
                    <div class="toolbar-group">
                        <button class="editor-button" data-action="new" title="New">📄</button>
                        <button class="editor-button" data-action="open" title="Open">📂</button>
                        <button class="editor-button" data-action="save" title="Save">💾</button>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group">
                        <button class="editor-button" data-action="undo" title="Undo">↶</button>
                        <button class="editor-button" data-action="redo" title="Redo">↷</button>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group">
                        <button class="editor-button" data-action="cut" title="Cut">✂️</button>
                        <button class="editor-button" data-action="copy" title="Copy">📋</button>
                        <button class="editor-button" data-action="paste" title="Paste">📄</button>
                    </div>
                    
                    <div class="toolbar-separator"></div>
                    
                    <div class="toolbar-group">
                        <select class="font-select" id="font-family">
                            <option value="system">System Font</option>
                            <option value="monospace">Monospace</option>
                            <option value="serif">Serif</option>
                            <option value="sans-serif">Sans Serif</option>
                        </select>
                        
                        <select class="font-select" id="font-size">
                            <option value="12">12</option>
                            <option value="14" selected>14</option>
                            <option value="16">16</option>
                            <option value="18">18</option>
                            <option value="20">20</option>
                            <option value="24">24</option>
                        </select>
                    </div>
                </div>
                
                <div class="editor-content">
                    <div class="editor-info">
                        <div class="file-info">
                            <span class="filename">Untitled</span>
                            <span class="modified-indicator" style="display: none;">•</span>
                        </div>
                        <div class="editor-stats">
                            <span class="line-count">Line 1</span>
                            <span class="char-count">0 characters</span>
                        </div>
                    </div>
                    
                    <textarea class="editor-textarea" id="editor-textarea" 
                              placeholder="Start typing your document here..."></textarea>
                </div>
            </div>
            
            <style>
                .editor-window {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: rgba(255, 255, 255, 0.95);
                }
                
                .editor-toolbar {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: rgba(240, 240, 240, 0.8);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    flex-shrink: 0;
                    flex-wrap: wrap;
                }
                
                .toolbar-group {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .toolbar-separator {
                    width: 1px;
                    height: 20px;
                    background: rgba(0, 0, 0, 0.2);
                    margin: 0 4px;
                }
                
                .editor-button {
                    width: 32px;
                    height: 28px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    background: rgba(255, 255, 255, 0.8);
                    border-radius: 4px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }
                
                .editor-button:hover {
                    background: rgba(255, 255, 255, 1);
                    border-color: rgba(0, 0, 0, 0.3);
                    transform: translateY(-1px);
                }
                
                .editor-button:active {
                    transform: translateY(0);
                }
                
                .font-select {
                    padding: 4px 8px;
                    border: 1px solid rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.9);
                    font-size: 12px;
                    cursor: pointer;
                }
                
                .font-select:focus {
                    outline: none;
                    border-color: #007AFF;
                    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
                }
                
                .editor-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .editor-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 16px;
                    background: rgba(248, 248, 248, 0.8);
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    font-size: 12px;
                    color: #666;
                    flex-shrink: 0;
                }
                
                .file-info {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .filename {
                    font-weight: 500;
                    color: #333;
                }
                
                .modified-indicator {
                    color: #ff6b35;
                    font-size: 16px;
                }
                
                .editor-stats {
                    display: flex;
                    gap: 16px;
                }
                
                .editor-textarea {
                    flex: 1;
                    border: none;
                    padding: 16px;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    line-height: 1.6;
                    resize: none;
                    outline: none;
                    background: transparent;
                    color: #333;
                }
                
                .editor-textarea::placeholder {
                    color: #999;
                    font-style: italic;
                }
                
                .editor-textarea:focus {
                    background: rgba(255, 255, 255, 0.1);
                }
            </style>
        `;
    }

    setupEditorWindow(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        const windowData = this.windows.get(windowId);
        
        // Toolbar buttons
        const buttons = windowElement.querySelectorAll('[data-action]');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleToolbarAction(windowId, button.dataset.action);
            });
        });
        
        // Font controls
        const fontFamily = windowElement.querySelector('#font-family');
        const fontSize = windowElement.querySelector('#font-size');
        
        fontFamily.addEventListener('change', () => {
            this.updateFont(windowId);
        });
        
        fontSize.addEventListener('change', () => {
            this.updateFont(windowId);
        });
        
        // Textarea events
        textarea.addEventListener('input', () => {
            this.handleTextChange(windowId);
        });
        
        textarea.addEventListener('keydown', (e) => {
            this.handleKeyDown(windowId, e);
        });
        
        // Auto-save (every 30 seconds if modified)
        setInterval(() => {
            if (windowData.modified) {
                this.autoSave(windowId);
            }
        }, 30000);
        
        // Focus textarea
        setTimeout(() => textarea.focus(), 100);
    }

    handleToolbarAction(windowId, action) {
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        
        switch (action) {
            case 'new':
                this.newDocument(windowId);
                break;
            case 'open':
                this.openDocument(windowId);
                break;
            case 'save':
                this.saveDocument(windowId);
                break;
            case 'undo':
                document.execCommand('undo');
                break;
            case 'redo':
                document.execCommand('redo');
                break;
            case 'cut':
                document.execCommand('cut');
                break;
            case 'copy':
                document.execCommand('copy');
                break;
            case 'paste':
                document.execCommand('paste');
                break;
        }
    }

    handleTextChange(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        
        windowData.content = textarea.value;
        windowData.modified = true;
        
        this.updateFileInfo(windowId);
        this.updateStats(windowId);
    }

    handleKeyDown(windowId, event) {
        // Handle keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key.toLowerCase()) {
                case 'n':
                    event.preventDefault();
                    this.newDocument(windowId);
                    break;
                case 'o':
                    event.preventDefault();
                    this.openDocument(windowId);
                    break;
                case 's':
                    event.preventDefault();
                    this.saveDocument(windowId);
                    break;
                case 'a':
                    // Let default select all behavior work
                    break;
            }
        }
        
        // Tab key handling
        if (event.key === 'Tab') {
            event.preventDefault();
            const textarea = event.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 4;
            
            this.handleTextChange(windowId);
        }
    }

    newDocument(windowId) {
        const windowData = this.windows.get(windowId);
        
        if (windowData.modified) {
            SystemUtils.showModal(
                'Save Changes',
                'Do you want to save changes to this document?',
                [
                    { text: 'Cancel', value: 'cancel' },
                    { text: "Don't Save", value: 'dont-save' },
                    { text: 'Save', primary: true, value: 'save' }
                ]
            ).then(result => {
                if (result === 'save') {
                    this.saveDocument(windowId).then(() => this.createNewDocument(windowId));
                } else if (result === 'dont-save') {
                    this.createNewDocument(windowId);
                }
            });
        } else {
            this.createNewDocument(windowId);
        }
    }

    createNewDocument(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        
        windowData.filename = null;
        windowData.modified = false;
        windowData.content = '';
        
        textarea.value = '';
        this.updateFileInfo(windowId);
        this.updateStats(windowId);
        
        textarea.focus();
        SystemUtils.showNotification('TextEdit', 'New document created');
    }

    openDocument(windowId) {
        // Simulate file picker
        const mockFiles = [
            'README.txt',
            'Notes.txt',
            'Todo.md',
            'Letter.txt',
            'Code.js'
        ];
        
        SystemUtils.showModal(
            'Open Document',
            `
                <div style="margin: 16px 0;">
                    <p>Select a document to open:</p>
                    <select id="file-select" style="width: 100%; padding: 8px; margin: 8px 0;">
                        ${mockFiles.map(file => `<option value="${file}">${file}</option>`).join('')}
                    </select>
                </div>
            `,
            [
                { text: 'Cancel', value: 'cancel' },
                { text: 'Open', primary: true, value: 'open' }
            ]
        ).then(result => {
            if (result === 'open') {
                const fileSelect = document.getElementById('file-select');
                const filename = fileSelect?.value;
                if (filename) {
                    this.loadDocument(windowId, filename);
                }
            }
        });
    }

    loadDocument(windowId, filename) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        
        // Mock file content
        const mockContent = {
            'README.txt': 'Welcome to BrowserOS!\n\nThis is a browser-based operating system built with HTML, CSS, and JavaScript.\n\nFeatures:\n- Desktop environment\n- File manager\n- Terminal\n- Text editor\n- And more!',
            'Notes.txt': 'Meeting Notes - Aug 16, 2025\n\n- Discuss project timeline\n- Review current features\n- Plan next steps\n- Assign tasks\n\nAction items:\n1. Complete file manager\n2. Add more applications\n3. Improve UI/UX',
            'Todo.md': '# Todo List\n\n## Today\n- [x] Wake up\n- [x] Drink coffee\n- [ ] Work on BrowserOS\n- [ ] Write documentation\n\n## This Week\n- [ ] Add more apps\n- [ ] Test on different browsers\n- [ ] Create user guide',
            'Letter.txt': 'Dear Friend,\n\nI hope this letter finds you well. I wanted to share some exciting news about the BrowserOS project I\'ve been working on.\n\nThe system is coming along nicely, with a desktop environment that feels familiar yet modern.\n\nBest regards,\nThe Developer',
            'Code.js': '// Sample JavaScript code\nfunction greetUser(name) {\n    return `Hello, ${name}! Welcome to BrowserOS.`;\n}\n\n// Usage example\nconst message = greetUser("User");\nconsole.log(message);\n\n// Event handling\ndocument.addEventListener("DOMContentLoaded", () => {\n    console.log("BrowserOS loaded successfully!");\n});'
        };
        
        const content = mockContent[filename] || 'File content not available';
        
        windowData.filename = filename;
        windowData.modified = false;
        windowData.content = content;
        
        textarea.value = content;
        this.updateFileInfo(windowId);
        this.updateStats(windowId);
        
        SystemUtils.showNotification('TextEdit', `Opened ${filename}`);
    }

    saveDocument(windowId) {
        return new Promise((resolve) => {
            if (window.configManager) {
                // Use persistent storage
                const success = this.saveCurrentFile(windowId);
                resolve(success);
            } else {
                // Fallback to old behavior
                const windowData = this.windows.get(windowId);
                
                if (windowData.filename) {
                    // Save existing file
                    windowData.modified = false;
                    this.updateFileInfo(windowId);
                    SystemUtils.showNotification('TextEdit', `Saved ${windowData.filename}`);
                    resolve();
                } else {
                    // Save as new file
                    SystemUtils.showModal(
                        'Save Document',
                        `
                            <div style="margin: 16px 0;">
                                <p>Enter a filename for your document:</p>
                                <input type="text" id="filename-input" 
                                       style="width: 100%; padding: 8px; margin: 8px 0;"
                                       placeholder="document.txt">
                            </div>
                        `,
                        [
                            { text: 'Cancel', value: 'cancel' },
                            { text: 'Save', primary: true, value: 'save' }
                        ]
                    ).then(result => {
                        if (result === 'save') {
                            const filenameInput = document.getElementById('filename-input');
                            const filename = filenameInput?.value.trim() || 'document.txt';
                            
                            windowData.filename = filename;
                            windowData.modified = false;
                            this.updateFileInfo(windowId);
                            SystemUtils.showNotification('TextEdit', `Saved as ${filename}`);
                        }
                        resolve();
                    });
                }
            }
        });
    }

    autoSave(windowId) {
        const windowData = this.windows.get(windowId);
        if (windowData.filename && windowData.modified) {
            windowData.modified = false;
            this.updateFileInfo(windowId);
            SystemUtils.showNotification('TextEdit', `Auto-saved ${windowData.filename}`, 2000);
        }
    }

    updateFont(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        const fontFamily = windowElement.querySelector('#font-family');
        const fontSize = windowElement.querySelector('#font-size');
        
        const family = fontFamily.value;
        const size = fontSize.value;
        
        let fontFamilyCSS = '';
        switch (family) {
            case 'monospace':
                fontFamilyCSS = '"Monaco", "Menlo", "Ubuntu Mono", monospace';
                break;
            case 'serif':
                fontFamilyCSS = '"Times New Roman", Times, serif';
                break;
            case 'sans-serif':
                fontFamilyCSS = 'Arial, Helvetica, sans-serif';
                break;
            default:
                fontFamilyCSS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        }
        
        textarea.style.fontFamily = fontFamilyCSS;
        textarea.style.fontSize = `${size}px`;
    }

    updateFileInfo(windowId) {
        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        const filename = windowElement.querySelector('.filename');
        const modifiedIndicator = windowElement.querySelector('.modified-indicator');
        
        filename.textContent = windowData.filename || 'Untitled';
        modifiedIndicator.style.display = windowData.modified ? 'inline' : 'none';
        
        // Update window title
        const windowObj = windowManager.getWindow(windowId);
        const title = (windowData.filename || 'Untitled') + (windowData.modified ? ' •' : '');
        windowObj.element.querySelector('.window-title').textContent = title;
    }

    updateStats(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        const lineCount = windowElement.querySelector('.line-count');
        const charCount = windowElement.querySelector('.char-count');
        
        const text = textarea.value;
        const lines = text.split('\n').length;
        const chars = text.length;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        // Get current cursor position
        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = text.substring(0, cursorPosition);
        const currentLine = textBeforeCursor.split('\n').length;
        
        lineCount.textContent = `Line ${currentLine} of ${lines}`;
        charCount.textContent = `${chars} characters, ${words} words`;
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

        // Update textarea dimensions to be responsive
        const textarea = windowElement.querySelector('#editor-textarea');
        if (textarea) {
            // Force the textarea to recalculate its size based on the new window size
            // The CSS will handle the responsiveness, but we trigger a reflow
            textarea.style.height = 'auto';
            setTimeout(() => {
                textarea.style.height = ''; // Reset to CSS-defined height
            }, 0);
        }

        // Update any other responsive elements if needed
        const editorWindow = windowElement.querySelector('.editor-window');
        if (editorWindow) {
            // Trigger reflow for responsive layout
            editorWindow.style.display = 'flex';
        }
    }

    /**
     * Apply TextEditor settings from config
     */
    applySettings(settings) {
        // Apply settings to all open editor windows
        this.windows.forEach((windowData, windowId) => {
            const windowElement = windowManager.getWindow(windowId).element;
            const textarea = windowElement.querySelector('#editor-textarea');
            
            if (textarea) {
                textarea.style.fontSize = `${settings.fontSize || 14}px`;
                textarea.style.wordWrap = settings.wordWrap ? 'break-word' : 'normal';
                
                // Apply theme if specified
                if (settings.theme === 'dark') {
                    textarea.style.background = '#1e1e1e';
                    textarea.style.color = '#d4d4d4';
                } else {
                    textarea.style.background = '#ffffff';
                    textarea.style.color = '#000000';
                }
            }
        });
    }

    /**
     * Save file to persistent storage
     */
    saveCurrentFile(windowId) {
        if (!configManager) {
            console.warn('ConfigManager not available');
            return false;
        }

        const windowData = this.windows.get(windowId);
        const windowElement = windowManager.getWindow(windowId).element;
        const textarea = windowElement.querySelector('#editor-textarea');
        
        const fileContent = textarea.value;
        
        if (!windowData.filename) {
            // Show save dialog (simplified)
            const fileName = prompt('Enter filename:', 'Untitled.txt');
            if (!fileName) return false;
            
            const filePath = `/Documents/${fileName}`;
            
            // Create new file in Documents folder
            if (configManager.createFile('/Documents', fileName, 'file', fileContent)) {
                windowData.filename = fileName;
                windowData.filepath = filePath;
                windowData.content = fileContent;
                windowData.modified = false;
                
                const titleElement = windowElement.querySelector('.window-title');
                titleElement.textContent = `TextEdit - ${fileName}`;
                
                this.showMessage(windowId, 'File saved successfully', 'success');
                return true;
            } else {
                this.showMessage(windowId, 'Failed to save file', 'error');
                return false;
            }
        } else {
            // Update existing file
            if (configManager.updateFileContent(windowData.filepath, fileContent)) {
                windowData.content = fileContent;
                windowData.modified = false;
                
                // Update window title (remove asterisk if present)
                const titleElement = windowElement.querySelector('.window-title');
                titleElement.textContent = `TextEdit - ${windowData.filename}`;
                
                this.showMessage(windowId, 'File saved successfully', 'success');
                return true;
            } else {
                this.showMessage(windowId, 'Failed to save file', 'error');
                return false;
            }
        }
    }

    /**
     * Show message in status bar
     */
    showMessage(windowId, message, type = 'info') {
        const windowElement = windowManager.getWindow(windowId).element;
        const statusBar = windowElement.querySelector('.editor-status-bar');
        
        if (!statusBar) return;
        
        const colorMap = {
            success: 'green',
            error: 'red',
            info: 'blue'
        };
        
        const originalContent = statusBar.innerHTML;
        statusBar.innerHTML = `<div style="color: ${colorMap[type] || 'black'}; font-weight: bold;">${message}</div>`;
        
        setTimeout(() => {
            statusBar.innerHTML = originalContent;
        }, 3000);
    }
}

// Initialize Text Editor app
window.textEditorApp = new TextEditorApp();
