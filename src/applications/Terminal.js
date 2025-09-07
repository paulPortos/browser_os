/**
 * Terminal Application - Command line interface
 */
class TerminalApp {
    constructor() {
        this.appId = 'terminal';
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
    }

    launch(options = {}) {
        const content = this.createTerminalContent();
        
        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'Terminal',
            content,
            {
                width: 700,
                height: 500,
                ...options
            }
        );

        this.windows.set(windowId, {
            history: [],
            historyIndex: -1,
            currentDirectory: '~',
            commandBuffer: ''
        });

        this.setupTerminalWindow(windowId);
        return windowId;
    }

    /**
     * Get the current system name from configuration
     */
    getSystemName() {
        if (window.configManager) {
            return window.configManager.get('system.systemName') || 'browseros';
        }
        return 'browseros';
    }

    /**
     * Generate the terminal prompt dynamically
     */
    generatePrompt(directory = '~') {
        const systemName = this.getSystemName();
        return `user@${systemName}:${directory}$ `;
    }

    createTerminalContent() {
        return `
            <div class="terminal-window">
                <div class="terminal-header">
                    <div class="terminal-title">bash — 80×24</div>
                    <div class="terminal-controls">
                        <button class="terminal-button" data-action="clear">Clear</button>
                        <button class="terminal-button" data-action="reset">Reset</button>
                    </div>
                </div>
                
                <div class="terminal-content" id="terminal-output">
                    <div class="terminal-welcome">
                        <div>Welcome to BrowserOS Terminal</div>
                        <div>Type 'help' for available commands</div>
                        <div></div>
                    </div>
                </div>
                
                <div class="terminal-input-line">
                    <span class="terminal-prompt" id="current-prompt">${this.generatePrompt()}</span>
                    <input type="text" class="terminal-input" id="terminal-input" autofocus>
                </div>
            </div>
            
            <style>
                .terminal-window {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    background: #1e1e1e;
                    color: #ffffff;
                    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .terminal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.1);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                }
                
                .terminal-title {
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.8);
                }
                
                .terminal-controls {
                    display: flex;
                    gap: 8px;
                }
                
                .terminal-button {
                    padding: 4px 12px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    color: white;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .terminal-button:hover {
                    background: rgba(255, 255, 255, 0.2);
                    border-color: rgba(255, 255, 255, 0.3);
                }
                
                .terminal-content {
                    flex: 1;
                    padding: 16px;
                    overflow-y: auto;
                    overflow-x: hidden;
                    word-wrap: break-word;
                }
                
                .terminal-welcome {
                    color: #4CAF50;
                    margin-bottom: 16px;
                }
                
                .terminal-input-line {
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    flex-shrink: 0;
                }
                
                .terminal-prompt {
                    color: #4CAF50;
                    font-weight: 600;
                    white-space: nowrap;
                    margin-right: 8px;
                }
                
                .terminal-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: white;
                    font-family: inherit;
                    font-size: inherit;
                    outline: none;
                    caret-color: white;
                }
                
                .command-line {
                    margin-bottom: 4px;
                    display: flex;
                }
                
                .command-prompt {
                    color: #4CAF50;
                    font-weight: 600;
                    margin-right: 8px;
                }
                
                .command-text {
                    color: white;
                }
                
                .command-output {
                    margin-bottom: 16px;
                    white-space: pre-wrap;
                }
                
                .output-success {
                    color: #4CAF50;
                }
                
                .output-error {
                    color: #f44336;
                }
                
                .output-warning {
                    color: #ff9800;
                }
                
                .output-info {
                    color: #2196f3;
                }
                
                .output-muted {
                    color: #666;
                }
                
                .terminal-content::-webkit-scrollbar {
                    width: 8px;
                }
                
                .terminal-content::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .terminal-content::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                }
                
                .terminal-content::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.5);
                }
            </style>
        `;
    }

    setupTerminalWindow(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const input = windowElement.querySelector('#terminal-input');
        const output = windowElement.querySelector('#terminal-output');
        const windowData = this.windows.get(windowId);
        
        // Focus input when window is clicked
        windowElement.addEventListener('click', () => {
            input.focus();
        });
        
        // Handle input commands
        input.addEventListener('keydown', (e) => {
            this.handleKeyDown(windowId, e);
        });
        
        // Terminal control buttons
        const clearButton = windowElement.querySelector('[data-action="clear"]');
        const resetButton = windowElement.querySelector('[data-action="reset"]');
        
        clearButton.addEventListener('click', () => this.clearTerminal(windowId));
        resetButton.addEventListener('click', () => this.resetTerminal(windowId));
        
        // Auto-focus input
        setTimeout(() => input.focus(), 100);
    }

    handleKeyDown(windowId, event) {
        const input = event.target;
        const windowData = this.windows.get(windowId);
        
        switch (event.key) {
            case 'Enter':
                event.preventDefault();
                const command = input.value.trim();
                if (command) {
                    this.executeCommand(windowId, command);
                    windowData.history.push(command);
                    windowData.historyIndex = windowData.history.length;
                }
                input.value = '';
                break;
                
            case 'ArrowUp':
                event.preventDefault();
                if (windowData.historyIndex > 0) {
                    windowData.historyIndex--;
                    input.value = windowData.history[windowData.historyIndex];
                }
                break;
                
            case 'ArrowDown':
                event.preventDefault();
                if (windowData.historyIndex < windowData.history.length - 1) {
                    windowData.historyIndex++;
                    input.value = windowData.history[windowData.historyIndex];
                } else {
                    windowData.historyIndex = windowData.history.length;
                    input.value = '';
                }
                break;
                
            case 'Tab':
                event.preventDefault();
                // Basic tab completion
                const currentValue = input.value;
                const completion = this.getTabCompletion(currentValue);
                if (completion) {
                    input.value = completion;
                }
                break;
                
            case 'c':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.addOutput(windowId, '^C', 'output-muted');
                    input.value = '';
                }
                break;
        }
    }

    executeCommand(windowId, command) {
        const windowData = this.windows.get(windowId);
        const prompt = this.generatePrompt(windowData.currentDirectory);
        
        // Add command to output
        this.addCommandLine(windowId, prompt, command);
        
        // Parse and execute command
        const args = this.parseCommand(command);
        const commandName = args[0].toLowerCase();
        
        switch (commandName) {
            case 'help':
                this.commandHelp(windowId, args);
                break;
            case 'ls':
            case 'dir':
                this.commandLs(windowId, args);
                break;
            case 'cd':
                this.commandCd(windowId, args);
                break;
            case 'pwd':
                this.commandPwd(windowId, args);
                break;
            case 'echo':
                this.commandEcho(windowId, args);
                break;
            case 'date':
                this.commandDate(windowId, args);
                break;
            case 'whoami':
                this.commandWhoami(windowId, args);
                break;
            case 'uname':
                this.commandUname(windowId, args);
                break;
            case 'clear':
                this.clearTerminal(windowId);
                break;
            case 'history':
                this.commandHistory(windowId, args);
                break;
            case 'cat':
                this.commandCat(windowId, args);
                break;
            case 'touch':
                this.commandTouch(windowId, args);
                break;
            case 'mkdir':
                this.commandMkdir(windowId, args);
                break;
            case 'rm':
                this.commandRm(windowId, args);
                break;
            case 'cp':
                this.commandCp(windowId, args);
                break;
            case 'mv':
                this.commandMv(windowId, args);
                break;
            case 'grep':
                this.commandGrep(windowId, args);
                break;
            case 'find':
                this.commandFind(windowId, args);
                break;
            case 'ps':
                this.commandPs(windowId, args);
                break;
            case 'top':
                this.commandTop(windowId, args);
                break;
            case 'hostname':
                this.commandHostname(windowId, args);
                break;
            case 'setsystemname':
                this.commandSetSystemName(windowId, args);
                break;
            case 'restart':
                this.commandRestart(windowId, args);
                break;
            case 'apps':
            case 'applications':
                this.commandListApplications(windowId, args);
                break;
            case 'pull':
                this.commandPull(windowId, args);
                break;
            case 'exit':
            case 'quit':
                windowManager.closeWindow(windowManager.getWindow(windowId).id);
                break;
            default:
                this.addOutput(windowId, `bash: ${commandName}: command not found`, 'output-error');
                break;
        }
    }

    parseCommand(command) {
        // Simple command parsing - splits by spaces but preserves quoted strings
        const args = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < command.length; i++) {
            const char = command[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) args.push(current);
        return args;
    }

    getTabCompletion(input) {
        const commands = [
            'help', 'ls', 'dir', 'cd', 'pwd', 'echo', 'date', 'whoami', 'uname',
            'clear', 'history', 'cat', 'touch', 'mkdir', 'rm', 'cp', 'mv',
            'grep', 'find', 'ps', 'top', 'hostname', 'setsystemname', 'restart', 
            'apps', 'applications', 'exit', 'quit'
        ];
        
        const matches = commands.filter(cmd => cmd.startsWith(input.toLowerCase()));
        return matches.length === 1 ? matches[0] : null;
    }

    addCommandLine(windowId, prompt, command) {
        const windowElement = windowManager.getWindow(windowId).element;
        const output = windowElement.querySelector('#terminal-output');
        
        const commandLine = document.createElement('div');
        commandLine.className = 'command-line';
        commandLine.innerHTML = `
            <span class="command-prompt">${prompt}</span>
            <span class="command-text">${SystemUtils.sanitizeHTML(command)}</span>
        `;
        
        output.appendChild(commandLine);
        this.scrollToBottom(windowId);
    }

    addOutput(windowId, text, className = '') {
        const windowElement = windowManager.getWindow(windowId).element;
        const output = windowElement.querySelector('#terminal-output');
        
        const outputLine = document.createElement('div');
        outputLine.className = `command-output ${className}`;
        outputLine.textContent = text;
        
        output.appendChild(outputLine);
        this.scrollToBottom(windowId);
    }

    scrollToBottom(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const output = windowElement.querySelector('#terminal-output');
        output.scrollTop = output.scrollHeight;
    }

    clearTerminal(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const output = windowElement.querySelector('#terminal-output');
        output.innerHTML = '';
    }

    resetTerminal(windowId) {
        const windowData = this.windows.get(windowId);
        windowData.history = [];
        windowData.historyIndex = -1;
        windowData.currentDirectory = '~';
        
        this.clearTerminal(windowId);
        this.addOutput(windowId, 'Terminal Reset', 'output-info');
    }

    // Command implementations
    commandHelp(windowId, args) {
        const helpText = `
Available commands:
  help         - Show this help message
  ls, dir      - List directory contents
  cd           - Change directory
  pwd          - Print working directory
  echo         - Display text
  date         - Show current date and time
  whoami       - Display current user
  uname        - System information
  hostname     - Display system name
  setsystemname - Set system name (hostname <name>)
  restart      - Restart the system
  apps         - List all installed applications
  pull         - Download and install applications
  clear        - Clear terminal
  history      - Show command history
  cat          - Display file contents
  touch        - Create empty file
  mkdir        - Create directory
  rm           - Remove files/directories or applications
  cp           - Copy files
  mv           - Move/rename files
  grep         - Search text patterns
  find         - Find files and directories
  ps           - Show running processes
  top          - Display system processes
  exit, quit   - Close terminal
        `.trim();
        
        this.addOutput(windowId, helpText, 'output-info');
    }

    commandLs(windowId, args) {
        const windowData = this.windows.get(windowId);
        const mockFiles = [
            'Applications',
            'Desktop',
            'Documents',
            'Downloads',
            'Library',
            'Movies',
            'Music',
            'Pictures',
            'Public',
            'bin',
            'usr',
            'var',
            'etc'
        ];
        
        if (args.includes('-la') || args.includes('-l')) {
            // Long format
            const longFormat = mockFiles.map(file => {
                const isDir = !file.includes('.');
                const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                const size = isDir ? '4096' : Math.floor(Math.random() * 10000).toString();
                const date = new Date().toLocaleDateString();
                return `${perms}  1 user  staff  ${size.padStart(6)}  ${date}  ${file}`;
            });
            this.addOutput(windowId, longFormat.join('\n'), 'output-success');
        } else {
            // Simple format
            this.addOutput(windowId, mockFiles.join('  '), 'output-success');
        }
    }

    commandCd(windowId, args) {
        const windowData = this.windows.get(windowId);
        const target = args[1] || '~';
        
        if (target === '~' || target === '/' || target === '..' || target.startsWith('/')) {
            windowData.currentDirectory = target === '~' ? '~' : target;
            this.updatePrompt(windowId);
        } else {
            this.addOutput(windowId, `cd: ${target}: No such file or directory`, 'output-error');
        }
    }

    commandPwd(windowId, args) {
        const windowData = this.windows.get(windowId);
        const fullPath = windowData.currentDirectory === '~' ? '/Users/user' : windowData.currentDirectory;
        this.addOutput(windowId, fullPath, 'output-success');
    }

    commandEcho(windowId, args) {
        const text = args.slice(1).join(' ');
        this.addOutput(windowId, text, 'output-success');
    }

    commandDate(windowId, args) {
        const now = new Date();
        this.addOutput(windowId, now.toString(), 'output-success');
    }

    commandWhoami(windowId, args) {
        this.addOutput(windowId, 'user', 'output-success');
    }

    commandUname(windowId, args) {
        const info = 'BrowserOS 1.0.0 x86_64';
        this.addOutput(windowId, info, 'output-success');
    }

    commandHistory(windowId, args) {
        const windowData = this.windows.get(windowId);
        const historyText = windowData.history
            .map((cmd, index) => `${index + 1}  ${cmd}`)
            .join('\n');
        this.addOutput(windowId, historyText || 'No command history', 'output-success');
    }

    commandCat(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'cat: missing file operand', 'output-error');
            return;
        }
        
        const filename = args[1];
        const mockContent = `This is the content of ${filename}\nLine 2 of the file\nLast line`;
        this.addOutput(windowId, mockContent, 'output-success');
    }

    commandTouch(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'touch: missing file operand', 'output-error');
            return;
        }
        
        const filename = args[1];
        this.addOutput(windowId, `File '${filename}' created`, 'output-success');
    }

    commandMkdir(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'mkdir: missing operand', 'output-error');
            return;
        }
        
        const dirname = args[1];
        this.addOutput(windowId, `Directory '${dirname}' created`, 'output-success');
    }

    commandRm(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'rm: missing operand', 'output-error');
            return;
        }
        
        const target = args[1];
        
        // Get all available applications by checking what's currently in the DOM
        const availableApps = this.getAvailableApplications();
        const essentialApps = ['finder', 'terminal', 'settings', 'browser', 'trash'];
        
        // Normalize the target name for comparison
        const normalizedTarget = this.normalizeAppName(target);
        
        // Check if the target is an application
        if (availableApps.includes(normalizedTarget)) {
            // Check if it's an essential app that can't be removed
            if (essentialApps.includes(normalizedTarget)) {
                this.addOutput(windowId, `rm: cannot remove '${target}': System-critical applications cannot be removed`, 'output-error');
                return;
            }
            
            // Remove the application
            this.removeApplication(normalizedTarget);
            this.addOutput(windowId, `Application '${target}' removed from system`, 'output-success');
            return;
        }
        
        // Check if user might have meant an application but used wrong name
        const suggestions = this.findSimilarApplications(normalizedTarget, availableApps);
        if (suggestions.length > 0) {
            this.addOutput(windowId, `rm: cannot remove '${target}': No such application`, 'output-error');
            this.addOutput(windowId, `Did you mean: ${suggestions.join(', ')}?`, 'output-info');
            return;
        }
        
        // Default file/directory removal
        this.addOutput(windowId, `Removed '${target}'`, 'output-success');
    }

    /**
     * Get all available applications from the DOM
     */
    getAvailableApplications() {
        const apps = [];
        
        // Get apps from desktop icons
        const desktopIcons = document.querySelectorAll('.desktop-icon[data-app]');
        desktopIcons.forEach(icon => {
            const appId = icon.getAttribute('data-app');
            if (appId && !apps.includes(appId)) {
                apps.push(appId);
            }
        });
        
        // Get apps from dock items
        const dockItems = document.querySelectorAll('.dock-item[data-app]');
        dockItems.forEach(item => {
            const appId = item.getAttribute('data-app');
            if (appId && !apps.includes(appId)) {
                apps.push(appId);
            }
        });
        
        return apps;
    }

    /**
     * Normalize application name for comparison
     */
    normalizeAppName(name) {
        return name.toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace('textedit', 'text-editor')  // Handle common variations
                  .replace('texteditor', 'text-editor')
                  .replace('calc', 'calculator')
                  .replace('cal', 'calendar');
    }

    /**
     * Find similar application names for suggestions
     */
    findSimilarApplications(target, availableApps) {
        const suggestions = [];
        const removableApps = availableApps.filter(app => 
            !['finder', 'terminal', 'settings', 'browser', 'trash'].includes(app)
        );
        
        // Look for partial matches
        for (const app of removableApps) {
            if (app.includes(target) || target.includes(app.replace('-', ''))) {
                suggestions.push(app);
            }
        }
        
        // If no partial matches, suggest all removable apps
        if (suggestions.length === 0 && target.length > 2) {
            return removableApps.slice(0, 3); // Limit to 3 suggestions
        }
        
        return suggestions;
    }

    /**
     * Remove application from desktop and dock
     */
    removeApplication(appName) {
        // Normalize app name
        const normalizedName = appName.toLowerCase().replace(/\s+/g, '-');
        
        // Remove from desktop
        const desktopIcon = document.querySelector(`.desktop-icon[data-app="${normalizedName}"]`);
        if (desktopIcon) {
            desktopIcon.remove();
        }
        
        // Remove from dock
        const dockItem = document.querySelector(`.dock-item[data-app="${normalizedName}"]`);
        if (dockItem) {
            dockItem.remove();
        }
        
        // Close any open windows of this application
        if (windowManager && windowManager.windows) {
            const windowsToClose = [];
            windowManager.windows.forEach((windowData, windowId) => {
                if (windowData.appId === normalizedName) {
                    windowsToClose.push(windowId);
                }
            });
            
            windowsToClose.forEach(windowId => {
                windowManager.closeWindow(windowId);
            });
        }
        
        // Emit event to notify system of application removal
        if (eventManager) {
            eventManager.emit('app:removed', { appId: normalizedName });
        }
    }

    commandCp(windowId, args) {
        if (args.length < 3) {
            this.addOutput(windowId, 'cp: missing destination file operand', 'output-error');
            return;
        }
        
        const source = args[1];
        const dest = args[2];
        this.addOutput(windowId, `Copied '${source}' to '${dest}'`, 'output-success');
    }

    commandMv(windowId, args) {
        if (args.length < 3) {
            this.addOutput(windowId, 'mv: missing destination file operand', 'output-error');
            return;
        }
        
        const source = args[1];
        const dest = args[2];
        this.addOutput(windowId, `Moved '${source}' to '${dest}'`, 'output-success');
    }

    commandGrep(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'grep: missing pattern', 'output-error');
            return;
        }
        
        const pattern = args[1];
        this.addOutput(windowId, `Searching for pattern: ${pattern}\nFound 3 matches`, 'output-success');
    }

    commandFind(windowId, args) {
        const path = args[1] || '.';
        const mockResults = [
            './Documents/file1.txt',
            './Documents/file2.pdf',
            './Desktop/shortcut.lnk',
            './Pictures/image.jpg'
        ];
        
        this.addOutput(windowId, mockResults.join('\n'), 'output-success');
    }

    commandPs(windowId, args) {
        const processes = [
            'PID TTY           TIME CMD',
            '  1 console    0:00.01 /sbin/launchd',
            ' 42 console    0:00.15 /usr/bin/finder',
            ' 89 ttys000    0:00.02 -bash',
            '123 ttys000    0:00.01 ps'
        ];
        
        this.addOutput(windowId, processes.join('\n'), 'output-success');
    }

    commandTop(windowId, args) {
        const topOutput = `
Processes: 156 total, 2 running, 154 sleeping.
Load Avg: 1.23, 1.45, 1.67  CPU usage: 15.2% user, 8.4% sys, 76.4% idle
PhysMem: 8192M used (2048M wired), 4096M unused.
VM: 2T vsize, 1G framework vsize, 0(0) swapins, 0(0) swapouts.

PID   COMMAND      %CPU TIME     #TH  #WQ  #PORT MEM    PURG
42    Finder       12.3  0:15.67  4    2    87    245M   0B
89    bash         0.1   0:00.23  1    0    18    2M     0B
123   top          8.7   0:00.45  1    0    24    4M     0B
        `.trim();
        
        this.addOutput(windowId, topOutput, 'output-success');
    }

    updatePrompt(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const windowData = this.windows.get(windowId);
        const promptElement = windowElement.querySelector('.terminal-prompt');
        
        if (promptElement) {
            promptElement.textContent = this.generatePrompt(windowData.currentDirectory);
        }
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

        // Update terminal output area for responsive behavior
        const output = windowElement.querySelector('.terminal-output');
        if (output) {
            // Trigger reflow and scroll to bottom if needed
            output.scrollTop = output.scrollHeight;
        }

        // Update input area
        const input = windowElement.querySelector('.terminal-input');
        if (input) {
            // Ensure input remains focused and properly sized
            input.style.width = '100%';
        }
    }

    /**
     * Show current hostname/system name
     */
    commandHostname(windowId, args) {
        const systemName = this.getSystemName();
        this.addOutput(windowId, systemName, 'output-text');
    }

    /**
     * Set the system name (hostname)
     */
    commandSetSystemName(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'Usage: setsystemname <new_name>', 'output-error');
            this.addOutput(windowId, 'Example: setsystemname mycomputer', 'output-text');
            return;
        }

        const newSystemName = args[1];
        
        // Validate system name (only alphanumeric characters and hyphens)
        if (!/^[a-zA-Z0-9-]+$/.test(newSystemName)) {
            this.addOutput(windowId, 'Error: System name can only contain letters, numbers, and hyphens', 'output-error');
            return;
        }

        // Update the configuration
        if (window.configManager) {
            window.configManager.set('system.systemName', newSystemName);
            this.addOutput(windowId, `System name changed to: ${newSystemName}`, 'output-success');
            
            // Update all open terminal prompts
            this.updateAllTerminalPrompts();
        } else {
            this.addOutput(windowId, 'Error: Configuration manager not available', 'output-error');
        }
    }

    /**
     * Update prompts in all open terminal windows
     */
    updateAllTerminalPrompts() {
        for (const [windowId, windowData] of this.windows) {
            this.updatePrompt(windowId);
        }
    }

    /**
     * Restart the system
     */
    commandRestart(windowId, args) {
        this.addOutput(windowId, 'Initiating system restart...', 'output-warning');
        
        // Create restart overlay
        setTimeout(() => {
            this.showRestartScreen();
        }, 1000);
    }

    /**
     * List all installed applications
     */
    commandListApplications(windowId, args) {
        const availableApps = this.getAvailableApplications();
        const essentialApps = ['finder', 'terminal', 'settings', 'browser', 'trash'];
        
        if (availableApps.length === 0) {
            this.addOutput(windowId, 'No applications found', 'output-warning');
            return;
        }
        
        this.addOutput(windowId, 'Installed Applications:', 'output-info');
        this.addOutput(windowId, '========================', 'output-info');
        
        // Get application titles from DOM
        const appDetails = availableApps.map(appId => {
            const dockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
            const title = dockItem ? dockItem.getAttribute('title') : appId;
            const isEssential = essentialApps.includes(appId);
            
            return {
                id: appId,
                title: title || appId,
                essential: isEssential
            };
        }).sort((a, b) => a.title.localeCompare(b.title));
        
        // Display applications
        appDetails.forEach(app => {
            const status = app.essential ? '[SYSTEM]' : '[REMOVABLE]';
            const statusClass = app.essential ? 'output-warning' : 'output-success';
            
            this.addOutput(windowId, `${app.title.padEnd(15)} ${status}`, statusClass);
        });
        
        this.addOutput(windowId, '', 'output-text');
        this.addOutput(windowId, `Total: ${availableApps.length} applications`, 'output-info');
        this.addOutput(windowId, 'Use "rm <app-id>" to remove non-system applications', 'output-muted');
    }

    /**
     * Pull (download/install) applications
     */
    commandPull(windowId, args) {
        if (args.length < 2) {
            this.addOutput(windowId, 'Usage: pull <application_name>', 'output-error');
            this.addOutput(windowId, 'Example: pull calculator', 'output-muted');
            return;
        }
        
        const targetApp = args[1];
        const normalizedTarget = this.normalizeAppName(targetApp);
        
        // Debug: Show what we're looking for and what we found
        const currentApps = this.getAvailableApplications();
        this.addOutput(windowId, `Debug: Looking for '${normalizedTarget}'`, 'output-info');
        this.addOutput(windowId, `Debug: Currently installed: [${currentApps.join(', ')}]`, 'output-info');
        
        // First check if application is already installed
        if (currentApps.includes(normalizedTarget)) {
            this.addOutput(windowId, `Application '${targetApp}' is already installed`, 'output-warning');
            return;
        }
        
        // Then check if application exists in applications folder
        const availableForDownload = this.getAvailableForDownload();
        
        if (!availableForDownload.includes(normalizedTarget)) {
            this.addOutput(windowId, `pull: application '${targetApp}' not found in repository`, 'output-error');
            
            // Suggest available applications
            if (availableForDownload.length > 0) {
                this.addOutput(windowId, `Available applications: ${availableForDownload.join(', ')}`, 'output-info');
            }
            return;
        }
        
        // Start the installation process
        this.installApplication(windowId, normalizedTarget, targetApp);
    }

    /**
     * Get applications available for download (check applications folder)
     */
    getAvailableForDownload() {
        // These are the applications that exist in the src/applications folder
        // but might not be on the desktop/dock yet
        const allPossibleApps = [
            'calculator',
            'text-editor', 
            'calendar',
            'browser',
            'settings',
            'finder'
        ];
        
        return allPossibleApps;
    }

    /**
     * Install application with progress animation
     */
    async installApplication(windowId, appId, originalName) {
        const windowElement = windowManager.getWindow(windowId).element;
        const input = windowElement.querySelector('#terminal-input');
        
        // Disable input during installation
        input.disabled = true;
        
        this.addOutput(windowId, `Initializing download for '${originalName}'...`, 'output-info');
        
        // Create progress line
        const output = windowElement.querySelector('#terminal-output');
        const progressLine = document.createElement('div');
        progressLine.className = 'command-output output-success';
        progressLine.innerHTML = `Installing: [<span id="progress-dots-${windowId}">.</span>] <span id="progress-percent-${windowId}">0%</span>`;
        output.appendChild(progressLine);
        this.scrollToBottom(windowId);
        
        // Animate progress
        let progress = 0;
        const maxDots = 10;
        
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15 + 5; // Random progress increment
            if (progress > 100) progress = 100;
            
            const dotsCount = Math.floor((progress / 100) * maxDots);
            const dots = '●'.repeat(dotsCount) + '.'.repeat(maxDots - dotsCount);
            
            const dotsElement = document.getElementById(`progress-dots-${windowId}`);
            const percentElement = document.getElementById(`progress-percent-${windowId}`);
            
            if (dotsElement && percentElement) {
                dotsElement.textContent = dots;
                percentElement.textContent = Math.floor(progress) + '%';
            }
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                // Installation complete
                setTimeout(() => {
                    this.addOutput(windowId, `Download successful! Installing '${originalName}'...`, 'output-success');
                    
                    setTimeout(() => {
                        // Add application to desktop
                        this.addApplicationToDesktop(appId, originalName);
                        this.addOutput(windowId, `Application '${originalName}' installed successfully`, 'output-success');
                        
                        // Re-enable input
                        input.disabled = false;
                        input.focus();
                    }, 1000);
                }, 500);
            }
        }, 200); // Update every 200ms
    }

    /**
     * Add application to desktop
     */
    addApplicationToDesktop(appId, displayName) {
        const desktopContent = document.getElementById('desktop-content');
        if (!desktopContent) return;
        
        // Check if already exists
        const existingIcon = document.querySelector(`.desktop-icon[data-app="${appId}"]`);
        if (existingIcon) return;
        
        // Get application info
        const appInfo = this.getApplicationInfo(appId);
        
        // Create desktop icon
        const desktopIcon = document.createElement('div');
        desktopIcon.className = 'desktop-icon';
        desktopIcon.setAttribute('data-app', appId);
        desktopIcon.innerHTML = `
            <div class="icon">${appInfo.icon}</div>
            <div class="label">${appInfo.label}</div>
        `;
        
        // Add to desktop
        desktopContent.appendChild(desktopIcon);
        
        // Add to dock if not exists
        this.addApplicationToDock(appId, appInfo);
        
        // Add click handler
        desktopIcon.addEventListener('click', () => {
            eventManager.emit('app:launch', { appId: appId });
        });
        
        // Add installed animation
        desktopIcon.style.opacity = '0';
        desktopIcon.style.transform = 'scale(0.5)';
        desktopIcon.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        setTimeout(() => {
            desktopIcon.style.opacity = '1';
            desktopIcon.style.transform = 'scale(1)';
        }, 100);
    }

    /**
     * Add application to dock
     */
    addApplicationToDock(appId, appInfo) {
        const dockContainer = document.querySelector('.dock-container');
        if (!dockContainer) return;
        
        // Check if already exists
        const existingDockItem = document.querySelector(`.dock-item[data-app="${appId}"]`);
        if (existingDockItem) return;
        
        // Find insertion point (before trash)
        const trashItem = document.querySelector('.dock-item.trash');
        
        const dockItem = document.createElement('div');
        dockItem.className = 'dock-item';
        dockItem.setAttribute('data-app', appId);
        dockItem.setAttribute('title', appInfo.label);
        dockItem.innerHTML = `
            <div class="dock-icon">${appInfo.icon}</div>
            <div class="dock-indicator"></div>
        `;
        
        // Insert before trash or at the end
        if (trashItem) {
            dockContainer.insertBefore(dockItem, trashItem);
        } else {
            dockContainer.appendChild(dockItem);
        }
        
        // Add click handler
        dockItem.addEventListener('click', () => {
            eventManager.emit('app:launch', { appId: appId });
        });
    }

    /**
     * Get application information (icon and label)
     */
    getApplicationInfo(appId) {
        const appInfoMap = {
            'calculator': { icon: '🧮', label: 'Calculator' },
            'text-editor': { icon: '📝', label: 'TextEdit' },
            'calendar': { icon: '📅', label: 'Calendar' },
            'browser': { icon: '🌐', label: 'Browser' },
            'settings': { icon: '⚙️', label: 'Settings' },
            'finder': { icon: '📁', label: 'Finder' }
        };
        
        return appInfoMap[appId] || { icon: '📱', label: appId };
    }

    /**
     * Show restart screen with loading animation
     */
    showRestartScreen() {
        // Create full-screen overlay
        const restartOverlay = document.createElement('div');
        restartOverlay.id = 'restart-overlay';
        restartOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: #000;
            color: #fff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 24px;
        `;

        // Add restart content
        restartOverlay.innerHTML = `
            <div style="text-align: center; animation: fadeIn 0.5s ease-in;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
                <div style="margin-bottom: 20px;">Restarting System...</div>
                <div style="width: 200px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; overflow: hidden;">
                    <div id="restart-progress" style="width: 0%; height: 100%; background: #4CAF50; transition: width 0.1s ease;"></div>
                </div>
                <div style="margin-top: 10px; font-size: 14px; opacity: 0.7;">Please wait...</div>
            </div>
            
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
        `;

        document.body.appendChild(restartOverlay);

        // Animate progress bar
        const progressBar = document.getElementById('restart-progress');
        let progress = 0;
        
        const progressInterval = setInterval(() => {
            progress += 2;
            progressBar.style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                // Wait a moment then reload
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            }
        }, 100); // 5 seconds total (50 * 100ms = 5000ms)
    }
}

// Initialize Terminal app
window.terminalApp = new TerminalApp();
