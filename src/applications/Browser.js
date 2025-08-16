/**
 * Browser Application - Simple web browser
 */
class BrowserApp {
    constructor() {
        this.appId = 'browser';
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
    }

    launch(options = {}) {
        const content = `
            <div style="height: 100%; display: flex; flex-direction: column; background: white;">
                <div style="padding: 16px; background: #f5f5f5; border-bottom: 1px solid #ddd;">
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: white;">←</button>
                        <button style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: white;">→</button>
                        <button style="padding: 6px 12px; border: 1px solid #ccc; border-radius: 4px; background: white;">⟳</button>
                        <input type="text" value="https://example.com" style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                </div>
                <iframe src="about:blank" style="flex: 1; border: none; background: white;" 
                        srcdoc="<h1>Welcome to BrowserOS Browser</h1><p>This is a simple browser implementation.</p><p>In a real implementation, this would load web pages.</p>">
                </iframe>
            </div>
        `;
        
        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'Browser',
            content,
            {
                width: 900,
                height: 700,
                ...options
            }
        );

        return windowId;
    }
}

// Initialize Browser app
window.browserApp = new BrowserApp();
