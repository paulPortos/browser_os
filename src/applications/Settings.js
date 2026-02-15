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
        if (window.eventManager) {
            eventManager.on('app:launch', (data) => {
                if (data.appId === this.appId) this.launch(data);
            });
            console.log('✅ SettingsApp initialized successfully');
        } else if (this.initRetryCount < this.maxRetries) {
            this.initRetryCount++;
            setTimeout(() => this.init(), 100);
            return;
        } else {
            console.error('❌ SettingsApp failed to initialize');
            return;
        }

        if (window.configManager) {
            this.currentSettings = window.configManager.getSettings();
        }
    }

    /* ================================================================ */
    /*  Launch                                                           */
    /* ================================================================ */

    launch(options = {}) {
        const settings = window.configManager ? window.configManager.getSettings() : {};
        const currentTheme = settings.theme || 'light';
        const systemName = settings.systemName || 'BrowserOS';

        const content = `
        ${this._styles()}
        <div class="sp-container">
            <div class="sp-sidebar">
                <div class="sp-sidebar-title">System Preferences</div>
                <div class="sp-nav-item sp-nav-active" data-section="general">⚙️ General</div>
                <div class="sp-nav-item" data-section="desktop">🖥️ Desktop & Dock</div>
                <div class="sp-nav-item" data-section="displays">🖵 Displays</div>
                <div class="sp-nav-item" data-section="sound">🔊 Sound</div>
                <div class="sp-nav-item" data-section="network">📶 Network</div>
                <div class="sp-nav-item" data-section="security">🔒 Security</div>
                <div class="sp-nav-item" data-section="report">🐛 Report Issue</div>
            </div>
            <div class="sp-content">
                <!-- GENERAL -->
                <div class="sp-section" data-section="general">
                    <h2>General</h2>
                    <div class="sp-field">
                        <label>System Name</label>
                        <input id="sp-system-name" type="text" value="${systemName}">
                    </div>
                    <div class="sp-field">
                        <label>Theme</label>
                        <select id="sp-theme">
                            <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>Light</option>
                            <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>Dark</option>
                        </select>
                    </div>
                    <div class="sp-field sp-checkbox-field">
                        <label><input id="sp-show-icons" type="checkbox" ${settings.showDesktopIcons !== false ? 'checked' : ''}> Show desktop icons</label>
                    </div>
                    <div class="sp-field sp-checkbox-field">
                        <label><input id="sp-animations" type="checkbox" ${settings.enableAnimations !== false ? 'checked' : ''}> Enable animations</label>
                    </div>
                    <div class="sp-actions">
                        <button class="sp-btn sp-btn-primary" id="sp-apply">✅ Apply Settings</button>
                        <button class="sp-btn sp-btn-danger" id="sp-reset">Reset to Defaults</button>
                    </div>
                </div>

                <!-- DESKTOP & DOCK -->
                <div class="sp-section sp-hidden" data-section="desktop">
                    <h2>Desktop & Dock</h2>

                    <h3 style="margin-top:0;">Desktop</h3>
                    <div class="sp-field">
                        <label>Icon Size</label>
                        <select id="sp-icon-size">
                            <option value="small" ${(settings.iconSize || configManager?.get('desktop.iconSize')) === 'small' ? 'selected' : ''}>Small</option>
                            <option value="medium" ${(!settings.iconSize && !configManager?.get('desktop.iconSize')) || (settings.iconSize || configManager?.get('desktop.iconSize')) === 'medium' ? 'selected' : ''}>Medium</option>
                            <option value="large" ${(settings.iconSize || configManager?.get('desktop.iconSize')) === 'large' ? 'selected' : ''}>Large</option>
                        </select>
                    </div>
                    <div class="sp-field">
                        <label>Desktop Background</label>
                        <button class="sp-btn sp-btn-secondary" id="sp-change-bg">🖼️ Choose Background…</button>
                    </div>

                    <hr class="sp-divider">
                    <h3>Dock</h3>
                    <div class="sp-field">
                        <label>Dock Size</label>
                        <input id="sp-dock-size" type="range" min="36" max="72" value="${this._getCurrentDockSize()}" style="width:200px;">
                        <span id="sp-dock-size-label" style="margin-left:8px;font-size:13px;color:#888;">${this._getCurrentDockSize()}px</span>
                    </div>
                    <div class="sp-field sp-checkbox-field">
                        <label><input id="sp-dock-autohide" type="checkbox" ${settings.autoHideDock ? 'checked' : ''}> Automatically hide and show the Dock</label>
                    </div>
                    <div class="sp-field sp-checkbox-field">
                        <label><input id="sp-dock-magnify" type="checkbox"> Magnification on hover</label>
                    </div>
                    <div class="sp-field">
                        <label>Dock Position</label>
                        <select id="sp-dock-position">
                            <option value="bottom" selected>Bottom</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                        </select>
                    </div>

                    <div class="sp-actions">
                        <button class="sp-btn sp-btn-primary" id="sp-apply-desktop">✅ Apply Desktop & Dock</button>
                    </div>
                </div>

                <!-- DISPLAYS -->
                <div class="sp-section sp-hidden" data-section="displays">
                    <h2>Displays</h2>
                    <p class="sp-placeholder">Display preferences coming soon…</p>
                </div>

                <!-- SOUND -->
                <div class="sp-section sp-hidden" data-section="sound">
                    <h2>Sound</h2>
                    <p class="sp-placeholder">Sound preferences coming soon…</p>
                </div>

                <!-- NETWORK -->
                <div class="sp-section sp-hidden" data-section="network">
                    <h2>Network</h2>
                    <p class="sp-placeholder">Network preferences coming soon…</p>
                </div>

                <!-- SECURITY -->
                <div class="sp-section sp-hidden" data-section="security">
                    <h2>Security</h2>
                    <p class="sp-placeholder">Security preferences coming soon…</p>
                </div>

                <!-- REPORT ISSUE -->
                <div class="sp-section sp-hidden" data-section="report">
                    <h2>🐛 Report an Issue</h2>
                    <p style="color:#666;margin-bottom:16px;">Found a bug or have feedback? Fill out the form below and it will be sent to the developer.</p>
                    <div class="sp-field">
                        <label>Title</label>
                        <input id="sp-report-title" type="text" placeholder="Brief summary of the issue">
                    </div>
                    <div class="sp-field">
                        <label>Category</label>
                        <select id="sp-report-category">
                            <option value="">— Select an issue type —</option>
                            <option value="Window Management">Window Management (close, minimize, maximize, drag)</option>
                            <option value="Desktop Icons">Desktop Icons (drag, align, double-click)</option>
                            <option value="Dock">Dock (launch, indicators, animation)</option>
                            <option value="Finder">Finder (navigation, files, folders)</option>
                            <option value="Terminal">Terminal (commands, output)</option>
                            <option value="TextEditor">TextEdit (editing, saving)</option>
                            <option value="Calculator">Calculator (operations, display)</option>
                            <option value="Browser">Browser (search, navigation)</option>
                            <option value="Calendar">Calendar (display, events)</option>
                            <option value="Settings">System Preferences</option>
                            <option value="Menu Bar">Menu Bar</option>
                            <option value="Performance">Performance / Lag</option>
                            <option value="UI/Visual">UI / Visual Bug</option>
                            <option value="Feature Request">Feature Request</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="sp-field">
                        <label>Description</label>
                        <textarea id="sp-report-desc" rows="6" placeholder="Please describe the issue in detail. Steps to reproduce are very helpful."></textarea>
                    </div>
                    <div id="sp-report-status" style="display:none;padding:10px;border-radius:6px;margin-bottom:12px;font-size:13px;"></div>
                    <div class="sp-actions">
                        <button class="sp-btn sp-btn-primary" id="sp-report-send">📧 Send Report</button>
                    </div>
                </div>
            </div>
        </div>`;

        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'System Preferences',
            content,
            { width: 820, height: 620, ...options }
        );

        this.windows.set(windowId, {
            windowId,
            element: windowManager.getWindow(windowId).element
        });

        this.setupEventListeners(windowId);
        return windowId;
    }

    /* ================================================================ */
    /*  Scoped Styles                                                    */
    /* ================================================================ */

    _styles() {
        return `<style>
        .sp-container{height:100%;display:flex;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;color:#222}
        .sp-sidebar{width:210px;background:#f5f5f7;border-right:1px solid #ddd;padding:16px 12px;flex-shrink:0;overflow-y:auto}
        .sp-sidebar-title{font-weight:700;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:12px;padding:0 8px}
        .sp-nav-item{padding:9px 12px;cursor:pointer;border-radius:6px;margin-bottom:2px;font-size:13px;transition:background .15s,color .15s;color:#333}
        .sp-nav-item:hover{background:rgba(0,122,255,.08)}
        .sp-nav-item.sp-nav-active{background:#007AFF;color:#fff !important}
        .sp-content{flex:1;padding:28px 32px;overflow-y:auto}
        .sp-section h2{margin:0 0 20px;font-size:22px;font-weight:600}
        .sp-section h3{margin:20px 0 12px;font-size:15px;font-weight:600;color:#555}
        .sp-hidden{display:none !important}
        .sp-field{margin-bottom:16px}
        .sp-field label{display:block;margin-bottom:6px;font-weight:500;font-size:13px;color:#444}
        .sp-field input[type="text"],.sp-field input[type="email"],.sp-field select,.sp-field textarea{
            padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;width:100%;max-width:340px;background:#fff;color:#222;outline:none;font-family:inherit}
        .sp-field textarea{max-width:100%;resize:vertical}
        .sp-field input:focus,.sp-field select:focus,.sp-field textarea:focus{border-color:#007AFF;box-shadow:0 0 0 3px rgba(0,122,255,.12)}
        .sp-checkbox-field label{display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:400}
        .sp-divider{border:none;height:1px;background:#ddd;margin:24px 0}
        .sp-actions{margin-top:24px;display:flex;gap:10px;flex-wrap:wrap}
        .sp-btn{padding:10px 20px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:all .2s}
        .sp-btn-primary{background:#007AFF;color:#fff}.sp-btn-primary:hover{background:#0062d1}
        .sp-btn-secondary{background:#e8e8ed;color:#333}.sp-btn-secondary:hover{background:#d8d8dd}
        .sp-btn-danger{background:#ff3b30;color:#fff}.sp-btn-danger:hover{background:#d62d23}
        .sp-placeholder{color:#999;font-style:italic}
        </style>`;
    }

    /* ================================================================ */
    /*  Event Wiring                                                     */
    /* ================================================================ */

    setupEventListeners(windowId) {
        const el = this.windows.get(windowId).element;

        /* ---------- Sidebar Navigation with highlighting ---------- */
        const navItems = el.querySelectorAll('.sp-nav-item');
        const sections = el.querySelectorAll('.sp-section');

        navItems.forEach(nav => {
            nav.addEventListener('click', () => {
                // Remove active from all
                navItems.forEach(n => n.classList.remove('sp-nav-active'));
                // Set active on clicked
                nav.classList.add('sp-nav-active');

                // Toggle section visibility
                const target = nav.dataset.section;
                sections.forEach(s => {
                    s.classList.toggle('sp-hidden', s.dataset.section !== target);
                });
            });
        });

        /* ---------- General Section ---------- */
        const themeSelect = el.querySelector('#sp-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => this.changeTheme(e.target.value));
        }

        const applyBtn = el.querySelector('#sp-apply');
        if (applyBtn) applyBtn.addEventListener('click', () => this.applyGeneralSettings(windowId));

        const resetBtn = el.querySelector('#sp-reset');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetSettings(windowId));

        /* ---------- Desktop & Dock Section ---------- */
        const applyDesktop = el.querySelector('#sp-apply-desktop');
        if (applyDesktop) applyDesktop.addEventListener('click', () => this.applyDesktopDockSettings(windowId));

        const changeBg = el.querySelector('#sp-change-bg');
        if (changeBg) changeBg.addEventListener('click', () => {
            if (window.desktop) window.desktop.changeDesktopBackground();
        });

        const dockSizeSlider = el.querySelector('#sp-dock-size');
        const dockSizeLabel = el.querySelector('#sp-dock-size-label');
        if (dockSizeSlider) {
            dockSizeSlider.addEventListener('input', () => {
                if (dockSizeLabel) dockSizeLabel.textContent = dockSizeSlider.value + 'px';
            });
        }

        /* ---------- Report Issue Section ---------- */
        const sendReport = el.querySelector('#sp-report-send');
        if (sendReport) sendReport.addEventListener('click', () => this.sendIssueReport(windowId));

        /* ---------- Clean up ---------- */
        eventManager.on('window:closed', (data) => {
            if (data.windowId === windowId) this.windows.delete(windowId);
        });
    }

    /* ================================================================ */
    /*  General Settings                                                 */
    /* ================================================================ */

    changeTheme(theme) {
        if (!window.configManager) return;
        const s = window.configManager.getSettings();
        s.theme = theme;
        window.configManager.updateSettings(s);
        window.configManager.applyTheme(theme);
        this._notify('Theme changed');
    }

    applyGeneralSettings(windowId) {
        if (!window.configManager) { this._notify('Config not available', 'error'); return; }
        const el = this.windows.get(windowId).element;

        const newSettings = {
            systemName: el.querySelector('#sp-system-name').value,
            theme: el.querySelector('#sp-theme').value,
            showDesktopIcons: el.querySelector('#sp-show-icons').checked,
            enableAnimations: el.querySelector('#sp-animations').checked,
        };

        window.configManager.updateSettings(newSettings);
        window.configManager.applyTheme(newSettings.theme);

        // Show / hide desktop icons
        const desktopContent = document.getElementById('desktop-content');
        if (desktopContent) {
            desktopContent.style.display = newSettings.showDesktopIcons ? '' : 'none';
        }

        // Update system name in menu bar
        const menuItem = document.querySelector('.menubar .menu-item.active');
        if (menuItem) menuItem.textContent = newSettings.systemName;

        this._notify('Settings applied');
    }

    resetSettings(windowId) {
        if (!window.configManager) return;
        if (!confirm('Reset all settings to default?')) return;

        window.configManager.updateSettings({
            theme: 'light', systemName: 'BrowserOS',
            showDesktopIcons: true, enableAnimations: true, autoHideDock: false
        });
        window.configManager.applyTheme('light');
        windowManager.closeWindow(windowId);
        this.launch();
        this._notify('Settings reset');
    }

    /* ================================================================ */
    /*  Desktop & Dock Settings                                          */
    /* ================================================================ */

    _getCurrentDockSize() {
        const root = document.documentElement;
        const val = getComputedStyle(root).getPropertyValue('--dock-icon-size').trim();
        return parseInt(val) || 48;
    }

    applyDesktopDockSettings(windowId) {
        const el = this.windows.get(windowId).element;
        const root = document.documentElement;

        /* --- Icon Size --- */
        const iconSize = el.querySelector('#sp-icon-size').value;
        if (window.configManager) window.configManager.set('desktop.iconSize', iconSize);
        const sizeMap = { small: '60px', medium: '80px', large: '100px' };
        root.style.setProperty('--desktop-icon-size', sizeMap[iconSize] || '80px');

        /* --- Dock Size --- */
        const dockSize = parseInt(el.querySelector('#sp-dock-size').value) || 48;
        root.style.setProperty('--dock-icon-size', dockSize + 'px');
        root.style.setProperty('--dock-height', (dockSize + 16) + 'px');

        /* --- Dock Auto-hide --- */
        const autoHide = el.querySelector('#sp-dock-autohide').checked;
        const dockEl = document.getElementById('dock');
        if (dockEl) {
            if (autoHide) {
                dockEl.classList.add('dock-autohide');
            } else {
                dockEl.classList.remove('dock-autohide');
            }
        }
        if (window.configManager) {
            const s = window.configManager.getSettings();
            s.autoHideDock = autoHide;
            window.configManager.updateSettings(s);
        }

        /* --- Dock Magnification --- */
        const magnify = el.querySelector('#sp-dock-magnify');
        if (magnify && magnify.checked && window.dock && window.dock.enableMagnification) {
            window.dock.enableMagnification();
        }

        /* --- Dock Position --- */
        const position = el.querySelector('#sp-dock-position').value;
        if (dockEl) {
            dockEl.classList.remove('dock-left', 'dock-right', 'dock-bottom');
            dockEl.classList.add('dock-' + position);
        }

        this._notify('Desktop & Dock settings applied');
    }

    /* ================================================================ */
    /*  Report Issue                                                     */
    /* ================================================================ */

    sendIssueReport(windowId) {
        const el = this.windows.get(windowId).element;
        const title    = el.querySelector('#sp-report-title').value.trim();
        const category = el.querySelector('#sp-report-category').value;
        const desc     = el.querySelector('#sp-report-desc').value.trim();
        const statusEl = el.querySelector('#sp-report-status');

        // Validation
        if (!title) { this._showReportStatus(statusEl, 'Please enter a title.', 'error'); return; }
        if (!category) { this._showReportStatus(statusEl, 'Please select a category.', 'error'); return; }
        if (!desc) { this._showReportStatus(statusEl, 'Please enter a description.', 'error'); return; }

        const devEmail = window.envConfig ? window.envConfig.get('DEV_EMAIL') : '';
        if (!devEmail || devEmail === 'developer@yourdomain.com') {
            this._showReportStatus(statusEl, 'DEV_EMAIL not configured in .env — cannot send report. Please set it up.', 'error');
            return;
        }

        // Show loading
        const sendBtn = el.querySelector('#sp-report-send');
        const origText = sendBtn.textContent;
        sendBtn.disabled = true;
        sendBtn.textContent = '⏳ Sending…';

        // Use the EmailService
        if (window.emailService) {
            window.emailService.sendIssueReport({ title, category, description: desc })
                .then(() => {
                    this._showReportStatus(statusEl, '✅ Report sent successfully! Thank you for your feedback.', 'success');
                    el.querySelector('#sp-report-title').value = '';
                    el.querySelector('#sp-report-category').value = '';
                    el.querySelector('#sp-report-desc').value = '';
                })
                .catch(err => {
                    this._showReportStatus(statusEl, '❌ Failed to send: ' + err.message, 'error');
                })
                .finally(() => {
                    sendBtn.disabled = false;
                    sendBtn.textContent = origText;
                });
        } else {
            this._showReportStatus(statusEl, '❌ Email service not available. Check console.', 'error');
            sendBtn.disabled = false;
            sendBtn.textContent = origText;
        }
    }

    _showReportStatus(el, msg, type) {
        el.style.display = 'block';
        el.style.background = type === 'error' ? '#fff0f0' : '#f0fff4';
        el.style.color = type === 'error' ? '#c00' : '#080';
        el.style.border = '1px solid ' + (type === 'error' ? '#fcc' : '#beb');
        el.textContent = msg;
    }

    /* ================================================================ */
    /*  Helpers                                                          */
    /* ================================================================ */

    _notify(message, type = 'success') {
        if (typeof SystemUtils !== 'undefined' && SystemUtils.showNotification) {
            SystemUtils.showNotification('Settings', message);
        }
    }
}

// Initialize Settings app
try {
    window.settingsApp = new SettingsApp();
} catch (error) {
    console.error('❌ Failed to create SettingsApp:', error);
    window.settingsApp = { appId: 'settings', windows: new Map(), launch: () => null };
}
