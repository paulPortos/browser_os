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
                    <span class="terminal-prompt">user@browseros:~$ </span>
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
        const prompt = `user@browseros:${windowData.currentDirectory}$ `;
        
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
            'grep', 'find', 'ps', 'top', 'exit', 'quit'
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
  clear        - Clear terminal
  history      - Show command history
  cat          - Display file contents
  touch        - Create empty file
  mkdir        - Create directory
  rm           - Remove files/directories
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
        this.addOutput(windowId, `Removed '${target}'`, 'output-success');
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
            promptElement.textContent = `user@browseros:${windowData.currentDirectory}$ `;
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
}

// Initialize Terminal app
window.terminalApp = new TerminalApp();
