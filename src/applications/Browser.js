/**
 * Browser Application - Simple web browser with search
 */
class BrowserApp {
    constructor() {
        this.appId = 'browser';
        this.windows = new Map();

        // Bookmarks
        this.bookmarks = [
            { title: 'BrowserOS Home', url: 'home' },
            { title: 'Wikipedia', url: 'https://en.wikipedia.org' },
            { title: 'GitHub', url: 'https://github.com' },
        ];

        // Built-in pages
        this.pages = {
            'home': this.getHomePage.bind(this),
            'about:blank': () => '<html><body></body></html>',
            'bookmarks': this.getBookmarksPage.bind(this),
            'history': this.getHistoryPage.bind(this),
        };

        this.init();
    }

    init() {
        eventManager.on('app:launch', (data) => {
            if (data.appId === this.appId) {
                this.launch(data);
            }
        });
    }

    /** Create a per-window state object */
    _createWindowState() {
        return {
            history: ['home'],
            historyIndex: 0,
            currentUrl: 'home',
        };
    }

    launch(options = {}) {
        const content = this._buildChrome();

        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'Browser',
            content,
            { width: 900, height: 700, ...options }
        );

        if (!windowId) return null;

        const state = this._createWindowState();
        this.windows.set(windowId, state);

        // Wire up events after DOM is ready
        setTimeout(() => this._attach(windowId), 0);

        return windowId;
    }

    /* ------------------------------------------------------------------ */
    /*  UI                                                                 */
    /* ------------------------------------------------------------------ */

    _buildChrome() {
        return `
        <div class="browser-app" style="height:100%;display:flex;flex-direction:column;background:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
            <!-- Toolbar -->
            <div class="browser-toolbar" style="padding:8px 12px;background:#f0f0f0;border-bottom:1px solid #d0d0d0;display:flex;gap:6px;align-items:center;flex-shrink:0;">
                <button class="browser-btn browser-back" title="Back" style="padding:4px 10px;border:1px solid #c0c0c0;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;color:#555;">&#9664;</button>
                <button class="browser-btn browser-forward" title="Forward" style="padding:4px 10px;border:1px solid #c0c0c0;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;color:#555;">&#9654;</button>
                <button class="browser-btn browser-refresh" title="Refresh" style="padding:4px 10px;border:1px solid #c0c0c0;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;">&#8635;</button>
                <button class="browser-btn browser-home-btn" title="Home" style="padding:4px 10px;border:1px solid #c0c0c0;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;">&#8962;</button>
                <input class="browser-url" type="text" value="home" spellcheck="false"
                    style="flex:1;padding:6px 10px;border:1px solid #c0c0c0;border-radius:6px;font-size:13px;outline:none;background:#fff;" 
                    placeholder="Search or enter URL">
                <button class="browser-btn browser-go" title="Go" style="padding:4px 12px;border:1px solid #0071e3;border-radius:6px;background:#0071e3;color:#fff;cursor:pointer;font-size:13px;font-weight:500;">Go</button>
            </div>
            <!-- Bookmarks bar -->
            <div class="browser-bookmarks" style="padding:4px 12px;background:#fafafa;border-bottom:1px solid #e0e0e0;display:flex;gap:4px;flex-shrink:0;overflow-x:auto;">
                <button class="browser-bookmark-btn" data-url="home" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:11px;white-space:nowrap;">🏠 Home</button>
                <button class="browser-bookmark-btn" data-url="bookmarks" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:11px;white-space:nowrap;">⭐ Bookmarks</button>
                <button class="browser-bookmark-btn" data-url="history" style="padding:3px 8px;border:1px solid #ddd;border-radius:4px;background:#fff;cursor:pointer;font-size:11px;white-space:nowrap;">🕒 History</button>
            </div>
            <!-- Content area -->
            <iframe class="browser-frame" sandbox="allow-same-origin" style="flex:1;border:none;background:#fff;" srcdoc=""></iframe>
        </div>`;
    }

    /* ------------------------------------------------------------------ */
    /*  Event wiring                                                       */
    /* ------------------------------------------------------------------ */

    _attach(windowId) {
        const windowData = windowManager.getWindow(windowId);
        if (!windowData) return;
        const root = windowData.element;
        const state = this.windows.get(windowId);

        const urlInput = root.querySelector('.browser-url');
        const frame    = root.querySelector('.browser-frame');
        const backBtn  = root.querySelector('.browser-back');
        const fwdBtn   = root.querySelector('.browser-forward');
        const refBtn   = root.querySelector('.browser-refresh');
        const homeBtn  = root.querySelector('.browser-home-btn');
        const goBtn    = root.querySelector('.browser-go');

        const navigate = (url) => this._navigate(windowId, url);

        // Go button
        goBtn.addEventListener('click', () => navigate(urlInput.value.trim()));

        // Enter key in URL bar
        urlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                navigate(urlInput.value.trim());
            }
        });

        // Navigation buttons
        backBtn.addEventListener('click', () => this._goBack(windowId));
        fwdBtn.addEventListener('click', () => this._goForward(windowId));
        refBtn.addEventListener('click', () => navigate(state.currentUrl));
        homeBtn.addEventListener('click', () => navigate('home'));

        // Bookmark buttons
        root.querySelectorAll('.browser-bookmark-btn').forEach(btn => {
            btn.addEventListener('click', () => navigate(btn.dataset.url));
        });

        // Focus styling
        urlInput.addEventListener('focus', () => {
            urlInput.style.borderColor = '#0071e3';
            urlInput.style.boxShadow = '0 0 0 3px rgba(0,113,227,0.15)';
            urlInput.select();
        });
        urlInput.addEventListener('blur', () => {
            urlInput.style.borderColor = '#c0c0c0';
            urlInput.style.boxShadow = 'none';
        });

        // Load home page
        this._navigate(windowId, 'home');

        // Clean up on window close
        eventManager.on('window:closed', (data) => {
            if (data.windowId === windowId) {
                this.windows.delete(windowId);
            }
        });
    }

    /* ------------------------------------------------------------------ */
    /*  Navigation                                                         */
    /* ------------------------------------------------------------------ */

    _navigate(windowId, rawUrl) {
        const windowData = windowManager.getWindow(windowId);
        if (!windowData) return;
        const state = this.windows.get(windowId);

        const root  = windowData.element;
        const frame = root.querySelector('.browser-frame');
        const urlInput = root.querySelector('.browser-url');

        let url = (rawUrl || '').trim();
        if (!url) url = 'home';

        // Determine what kind of input this is
        let pageHtml;
        if (this.pages[url]) {
            // Built-in page
            pageHtml = this.pages[url]();
        } else if (/^https?:\/\//.test(url)) {
            // Looks like a real URL — show info page (can't load external due to sandbox)
            pageHtml = this._getExternalUrlPage(url);
        } else if (url.includes('.') && !url.includes(' ')) {
            // Looks like a domain
            const fullUrl = 'https://' + url;
            url = fullUrl;
            pageHtml = this._getExternalUrlPage(fullUrl);
        } else {
            // Treat as search query
            pageHtml = this._getSearchResultsPage(url);
            url = 'search://' + encodeURIComponent(url);
        }

        // Update frame
        frame.srcdoc = pageHtml;

        // Update URL bar display
        urlInput.value = url.startsWith('search://') ? decodeURIComponent(url.replace('search://', '')) : url;

        // Update window title
        const title = url === 'home' ? 'Browser' : (url.startsWith('search://') ? `Search: ${decodeURIComponent(url.replace('search://', ''))}` : url);
        const titleEl = root.querySelector('.window-title');
        if (titleEl) titleEl.textContent = title;

        // Push to history (trim forward history if navigating from middle)
        if (state.currentUrl !== url || state.history.length === 0) {
            if (state.historyIndex < state.history.length - 1) {
                state.history = state.history.slice(0, state.historyIndex + 1);
            }
            state.history.push(url);
            state.historyIndex = state.history.length - 1;
        }
        state.currentUrl = url;

        this._updateNavButtons(windowId);
    }

    _goBack(windowId) {
        const state = this.windows.get(windowId);
        if (!state || state.historyIndex <= 0) return;
        state.historyIndex--;
        const url = state.history[state.historyIndex];
        state.currentUrl = url;
        this._navigateDirect(windowId, url);
    }

    _goForward(windowId) {
        const state = this.windows.get(windowId);
        if (!state || state.historyIndex >= state.history.length - 1) return;
        state.historyIndex++;
        const url = state.history[state.historyIndex];
        state.currentUrl = url;
        this._navigateDirect(windowId, url);
    }

    /** Navigate without pushing to history */
    _navigateDirect(windowId, url) {
        const windowData = windowManager.getWindow(windowId);
        if (!windowData) return;
        const root  = windowData.element;
        const frame = root.querySelector('.browser-frame');
        const urlInput = root.querySelector('.browser-url');

        let pageHtml;
        if (this.pages[url]) {
            pageHtml = this.pages[url]();
        } else if (/^https?:\/\//.test(url)) {
            pageHtml = this._getExternalUrlPage(url);
        } else if (url.startsWith('search://')) {
            const query = decodeURIComponent(url.replace('search://', ''));
            pageHtml = this._getSearchResultsPage(query);
        } else {
            pageHtml = this._getSearchResultsPage(url);
        }

        frame.srcdoc = pageHtml;
        urlInput.value = url.startsWith('search://') ? decodeURIComponent(url.replace('search://', '')) : url;

        const title = url === 'home' ? 'Browser' : (url.startsWith('search://') ? `Search: ${decodeURIComponent(url.replace('search://', ''))}` : url);
        const titleEl = root.querySelector('.window-title');
        if (titleEl) titleEl.textContent = title;

        this._updateNavButtons(windowId);
    }

    _updateNavButtons(windowId) {
        const windowData = windowManager.getWindow(windowId);
        if (!windowData) return;
        const state = this.windows.get(windowId);
        const root = windowData.element;

        const backBtn = root.querySelector('.browser-back');
        const fwdBtn  = root.querySelector('.browser-forward');

        if (backBtn) {
            backBtn.disabled = state.historyIndex <= 0;
            backBtn.style.opacity = state.historyIndex <= 0 ? '0.4' : '1';
        }
        if (fwdBtn) {
            fwdBtn.disabled = state.historyIndex >= state.history.length - 1;
            fwdBtn.style.opacity = state.historyIndex >= state.history.length - 1 ? '0.4' : '1';
        }
    }

    /* ------------------------------------------------------------------ */
    /*  Page generators                                                    */
    /* ------------------------------------------------------------------ */

    _pageShell(body) {
        return `<!DOCTYPE html>
<html><head><style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#222;background:#fff;padding:0;line-height:1.5}
a{color:#1a0dab;text-decoration:none}a:hover{text-decoration:underline}
</style></head><body>${body}</body></html>`;
    }

    getHomePage() {
        return this._pageShell(`
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#f5f7fa 0%,#c3cfe2 100%);">
            <div style="font-size:48px;margin-bottom:8px;">🌐</div>
            <h1 style="font-size:28px;font-weight:600;color:#333;margin-bottom:24px;">BrowserOS</h1>
            <div style="width:90%;max-width:500px;margin-bottom:32px;position:relative;">
                <div style="background:#fff;border-radius:24px;box-shadow:0 2px 8px rgba(0,0,0,0.12);padding:4px;">
                    <div style="display:flex;align-items:center;gap:8px;padding:0 16px;">
                        <span style="color:#999;font-size:18px;">🔍</span>
                        <div style="flex:1;padding:12px 0;color:#999;font-size:15px;">Type in the address bar to search...</div>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;max-width:500px;">
                ${this.bookmarks.map(b => `
                    <div style="width:80px;text-align:center;cursor:default;">
                        <div style="width:56px;height:56px;border-radius:12px;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.1);display:flex;align-items:center;justify-content:center;margin:0 auto 6px;font-size:24px;">
                            ${b.url === 'home' ? '🏠' : b.url.includes('wiki') ? '📚' : '💻'}
                        </div>
                        <div style="font-size:11px;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b.title}</div>
                    </div>
                `).join('')}
            </div>
            <p style="margin-top:40px;color:#999;font-size:12px;">BrowserOS Browser v1.0</p>
        </div>`);
    }

    getBookmarksPage() {
        const items = this.bookmarks.map(b =>
            `<li style="padding:10px 0;border-bottom:1px solid #eee;">
                <a href="#">${b.title}</a>
                <div style="font-size:12px;color:#888;">${b.url}</div>
            </li>`
        ).join('');
        return this._pageShell(`
        <div style="max-width:600px;margin:40px auto;padding:0 20px;">
            <h1 style="font-size:22px;margin-bottom:16px;">⭐ Bookmarks</h1>
            <ul style="list-style:none;">${items}</ul>
        </div>`);
    }

    getHistoryPage() {
        // Collect history from all open windows
        const allHistory = [];
        this.windows.forEach((state) => {
            state.history.forEach(url => {
                if (!allHistory.includes(url)) allHistory.push(url);
            });
        });
        const items = allHistory.map(url =>
            `<li style="padding:8px 0;border-bottom:1px solid #eee;">
                <a href="#">${url.startsWith('search://') ? '🔍 ' + decodeURIComponent(url.replace('search://', '')) : url}</a>
            </li>`
        ).join('');
        return this._pageShell(`
        <div style="max-width:600px;margin:40px auto;padding:0 20px;">
            <h1 style="font-size:22px;margin-bottom:16px;">🕒 History</h1>
            <ul style="list-style:none;">${items || '<li style="padding:10px 0;color:#999;">No history yet</li>'}</ul>
        </div>`);
    }

    _getExternalUrlPage(url) {
        let domain = '';
        try { domain = new URL(url).hostname; } catch { domain = url; }
        return this._pageShell(`
        <div style="max-width:600px;margin:60px auto;padding:0 20px;text-align:center;">
            <div style="font-size:48px;margin-bottom:16px;">🔒</div>
            <h1 style="font-size:22px;margin-bottom:8px;">${domain}</h1>
            <p style="color:#666;margin-bottom:24px;">External websites cannot be loaded inside BrowserOS due to browser security restrictions (sandbox / same-origin policy).</p>
            <div style="background:#f0f7ff;border:1px solid #cce0ff;border-radius:8px;padding:16px;text-align:left;">
                <p style="font-weight:600;margin-bottom:8px;">🔗 Requested URL</p>
                <code style="word-break:break-all;font-size:13px;color:#0066cc;">${url}</code>
            </div>
            <p style="margin-top:20px;font-size:13px;color:#999;">Tip: Use the search feature to look up information within BrowserOS.</p>
        </div>`);
    }

    _getSearchResultsPage(query) {
        if (!query) return this.getHomePage();

        const results = this._generateSearchResults(query);
        const resultCards = results.map(r => `
            <div style="margin-bottom:24px;">
                <div style="font-size:12px;color:#006621;margin-bottom:2px;">${r.url}</div>
                <a href="#" style="font-size:18px;color:#1a0dab;font-weight:400;">${r.title}</a>
                <p style="font-size:13px;color:#545454;margin-top:4px;line-height:1.5;">${r.snippet}</p>
            </div>
        `).join('');

        return this._pageShell(`
        <div style="max-width:650px;margin:0 auto;padding:24px 20px;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid #e0e0e0;">
                <span style="font-size:28px;">🔍</span>
                <div>
                    <div style="font-size:20px;font-weight:500;color:#333;">Search results for</div>
                    <div style="font-size:15px;color:#1a73e8;font-weight:500;">"${this._escapeHtml(query)}"</div>
                </div>
            </div>
            <div style="font-size:12px;color:#999;margin-bottom:16px;">About ${results.length} results (0.${Math.floor(Math.random()*90+10)} seconds)</div>
            ${resultCards}
            ${results.length === 0 ? '<p style="color:#666;">No results found. Try different keywords.</p>' : ''}
        </div>`);
    }

    /* ------------------------------------------------------------------ */
    /*  Search engine (mock - no database)                                 */
    /* ------------------------------------------------------------------ */

    _generateSearchResults(query) {
        const q = query.toLowerCase();

        // Knowledge base of mock results
        const allResults = [
            { keywords: ['javascript', 'js', 'programming', 'code', 'web', 'script'], title: 'JavaScript - MDN Web Docs', url: 'developer.mozilla.org/en-US/docs/Web/JavaScript', snippet: 'JavaScript (JS) is a lightweight interpreted programming language with first-class functions. It is the language of the web and is used for client-side and server-side development.' },
            { keywords: ['html', 'web', 'page', 'markup', 'code'], title: 'HTML: HyperText Markup Language - MDN', url: 'developer.mozilla.org/en-US/docs/Web/HTML', snippet: 'HTML (HyperText Markup Language) is the most basic building block of the Web. It defines the meaning and structure of web content.' },
            { keywords: ['css', 'style', 'design', 'web', 'layout'], title: 'CSS: Cascading Style Sheets - MDN', url: 'developer.mozilla.org/en-US/docs/Web/CSS', snippet: 'Cascading Style Sheets (CSS) is a stylesheet language used to describe the presentation of a document written in HTML or XML.' },
            { keywords: ['python', 'programming', 'code', 'language'], title: 'Welcome to Python.org', url: 'www.python.org', snippet: 'Python is a programming language that lets you work quickly and integrate systems more effectively. It supports multiple programming paradigms.' },
            { keywords: ['react', 'javascript', 'js', 'framework', 'web', 'ui'], title: 'React – A JavaScript library for building user interfaces', url: 'reactjs.org', snippet: 'React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render the right components.' },
            { keywords: ['linux', 'os', 'operating system', 'unix', 'computer'], title: 'The Linux Kernel Archives', url: 'www.kernel.org', snippet: 'Linux is a clone of the operating system Unix, written from scratch by Linus Torvalds with assistance from a loosely-knit team of hackers across the Net.' },
            { keywords: ['macos', 'mac', 'apple', 'os', 'operating system'], title: 'macOS - Apple', url: 'www.apple.com/macos', snippet: 'macOS is the operating system that powers every Mac. It lets you do things you simply can\'t with other computers.' },
            { keywords: ['windows', 'microsoft', 'os', 'operating system', 'pc'], title: 'Windows | Microsoft', url: 'www.microsoft.com/windows', snippet: 'Explore Windows features, check out the latest updates, and get tips to help you get the most out of your Windows experience.' },
            { keywords: ['browser', 'web', 'internet', 'chrome', 'firefox'], title: 'How Web Browsers Work', url: 'web.dev/howbrowserswork', snippet: 'Web browsers are the most widely used software. In this primer, we explain how they work behind the scenes, from navigation to rendering.' },
            { keywords: ['calculator', 'math', 'compute', 'calculate'], title: 'Online Calculator - Math is Fun', url: 'www.mathsisfun.com/calculator.html', snippet: 'A free online calculator. Quick and easy, with large buttons for simple arithmetic. Features memory functions and scientific calculations.' },
            { keywords: ['terminal', 'command', 'shell', 'bash', 'cli', 'console'], title: 'Introduction to the Command Line', url: 'www.codecademy.com/articles/command-line-commands', snippet: 'The command line is a text interface for your computer where you type commands to perform specific tasks. Also known as Terminal, shell, or console.' },
            { keywords: ['file', 'folder', 'finder', 'explorer', 'manage'], title: 'File Management Basics', url: 'edu.gcfglobal.org/en/computerbasics/understanding-file-management', snippet: 'Understanding how file management works is an essential part of using a computer. Learn how to organize and manage files effectively.' },
            { keywords: ['text', 'editor', 'write', 'note', 'document'], title: 'Text Editors: A Comprehensive Guide', url: 'www.techjunkie.com/best-text-editors', snippet: 'A text editor is a type of computer program that edits plain text. From simple editors to full IDEs, find the right tool for your needs.' },
            { keywords: ['settings', 'preferences', 'config', 'system', 'setup'], title: 'System Preferences Guide', url: 'support.apple.com/guide/system-preferences', snippet: 'Use System Preferences to customize the way your system looks and works. Configure display, sound, network, and more.' },
            { keywords: ['weather', 'forecast', 'temperature', 'rain', 'sun'], title: 'Weather Forecast - Current Conditions', url: 'weather.com', snippet: 'Check your local weather forecast. Current conditions, hourly forecast, 10-day forecast, and radar for your area.' },
            { keywords: ['news', 'world', 'today', 'headlines', 'current'], title: 'Breaking News, Latest News and Videos', url: 'www.cnn.com', snippet: 'View the latest news and breaking news today for U.S., world, weather, entertainment, politics and health.' },
            { keywords: ['music', 'song', 'listen', 'audio', 'playlist'], title: 'Listen to Music Online', url: 'www.spotify.com', snippet: 'Spotify is a digital music service that gives you access to millions of songs, podcasts, and videos from artists all over the world.' },
            { keywords: ['video', 'watch', 'stream', 'movie', 'film'], title: 'YouTube', url: 'www.youtube.com', snippet: 'Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.' },
            { keywords: ['game', 'play', 'gaming', 'fun'], title: 'Free Online Games', url: 'www.miniclip.com', snippet: 'Play free online games including racing, sport, action, dress up, escape, and puzzle games. New games added daily!' },
            { keywords: ['email', 'mail', 'inbox', 'send', 'message'], title: 'Gmail - Email from Google', url: 'mail.google.com', snippet: 'Gmail is email that\'s intuitive, efficient, and useful. 15 GB of storage, less spam, and mobile access.' },
            { keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'deep learning'], title: 'What is Artificial Intelligence (AI)?', url: 'www.ibm.com/cloud/learn/what-is-artificial-intelligence', snippet: 'Artificial intelligence leverages computers and machines to mimic the problem-solving and decision-making capabilities of the human mind.' },
            { keywords: ['github', 'git', 'repository', 'code', 'open source'], title: 'GitHub: Let\'s build from here', url: 'github.com', snippet: 'GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage your Git repositories.' },
            { keywords: ['stackoverflow', 'stack overflow', 'question', 'answer', 'developer', 'help'], title: 'Stack Overflow - Developer Community', url: 'stackoverflow.com', snippet: 'Stack Overflow is the largest, most trusted online community for developers to learn, share their programming knowledge, and build their careers.' },
            { keywords: ['wikipedia', 'wiki', 'encyclopedia', 'knowledge', 'information'], title: 'Wikipedia, the free encyclopedia', url: 'en.wikipedia.org', snippet: 'Wikipedia is a free online encyclopedia, created and edited by volunteers around the world and hosted by the Wikimedia Foundation.' },
            { keywords: ['hello', 'hi', 'hey', 'greet'], title: 'Hello World - Wikipedia', url: 'en.wikipedia.org/wiki/Hello_world', snippet: '"Hello, World!" program is traditionally the first program written when learning a new programming language. It outputs "Hello, World!" to the screen.' },
            { keywords: ['browseros', 'browser os', 'desktop', 'web os'], title: 'BrowserOS - A Desktop in Your Browser', url: 'browseros.local', snippet: 'BrowserOS is a fully functional browser-based operating system built with HTML, CSS, and JavaScript. Features a Mac-inspired interface with apps, file management, and utilities.' },
        ];

        // Score and filter results
        const scored = allResults.map(r => {
            let score = 0;
            const words = q.split(/\s+/);
            for (const word of words) {
                if (word.length < 2) continue;
                for (const kw of r.keywords) {
                    if (kw.includes(word) || word.includes(kw)) score += 3;
                }
                if (r.title.toLowerCase().includes(word)) score += 2;
                if (r.snippet.toLowerCase().includes(word)) score += 1;
            }
            return { ...r, score };
        }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

        // Always return at least a best-effort result
        if (scored.length === 0) {
            return [{
                title: `Results for "${this._escapeHtml(query)}"`,
                url: 'www.google.com/search?q=' + encodeURIComponent(query),
                snippet: `No exact matches found in the BrowserOS knowledge base. In a full browser, this would search the web for "${this._escapeHtml(query)}".`
            }];
        }

        return scored.slice(0, 8);
    }

    _escapeHtml(str) {
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

// Initialize Browser app
window.browserApp = new BrowserApp();
