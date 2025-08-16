/**
 * Calculator Application - Advanced Scientific Calculator with History
 */
class CalculatorApp {
    constructor() {
        this.appId = 'calculator';
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
        const content = this.createCalculatorContent();
        
        const windowId = windowManager.openWindow(
            this.appId,
            options.title || 'Scientific Calculator',
            content,
            {
                width: 480,
                height: 520,
                resizable: true,
                minWidth: 400,
                minHeight: 480,
                ...options
            }
        );

        this.windows.set(windowId, {
            display: '0',
            previousValue: null,
            operation: null,
            waitingForNewValue: false,
            lastOperation: null,
            memory: 0,
            history: [],
            angleMode: 'deg', // 'deg', 'rad'
            showHistory: false
        });

        this.setupCalculatorWindow(windowId);
        return windowId;
    }

    createCalculatorContent() {
        return `
            <div class="calculator-window">
                <div class="calculator-header">
                    <button class="history-toggle" data-action="toggle-history">History</button>
                    <div class="angle-mode">
                        <button class="angle-button active" data-mode="deg">DEG</button>
                        <button class="angle-button" data-mode="rad">RAD</button>
                    </div>
                </div>
                
                <div class="calculator-main">
                    <div class="calculator-left">
                        <div class="calculator-display">
                            <div class="display-secondary" id="secondary-display"></div>
                            <div class="display-primary" id="primary-display">0</div>
                        </div>
                        
                        <div class="calculator-buttons">
                            <!-- Memory and special functions row -->
                            <div class="button-row">
                                <button class="calc-button memory" data-action="memory-clear">MC</button>
                                <button class="calc-button memory" data-action="memory-recall">MR</button>
                                <button class="calc-button memory" data-action="memory-add">M+</button>
                                <button class="calc-button memory" data-action="memory-subtract">M-</button>
                                <button class="calc-button clear" data-action="all-clear">AC</button>
                                <button class="calc-button clear" data-action="clear">C</button>
                            </div>
                            
                            <!-- Scientific functions row 1 -->
                            <div class="button-row">
                                <button class="calc-button scientific" data-function="sin">sin</button>
                                <button class="calc-button scientific" data-function="cos">cos</button>
                                <button class="calc-button scientific" data-function="tan">tan</button>
                                <button class="calc-button scientific" data-function="log">log</button>
                                <button class="calc-button scientific" data-function="ln">ln</button>
                                <button class="calc-button operator" data-operation="^">x^y</button>
                            </div>
                            
                            <!-- Scientific functions row 2 -->
                            <div class="button-row">
                                <button class="calc-button scientific" data-function="asin">asin</button>
                                <button class="calc-button scientific" data-function="acos">acos</button>
                                <button class="calc-button scientific" data-function="atan">atan</button>
                                <button class="calc-button scientific" data-function="exp">e^x</button>
                                <button class="calc-button scientific" data-function="sqrt">√</button>
                                <button class="calc-button operator" data-operation="root">ⁿ√x</button>
                            </div>
                            
                            <!-- Constants and special values -->
                            <div class="button-row">
                                <button class="calc-button constant" data-value="pi">π</button>
                                <button class="calc-button constant" data-value="e">e</button>
                                <button class="calc-button scientific" data-function="factorial">x!</button>
                                <button class="calc-button operator" data-action="sign">±</button>
                                <button class="calc-button operator" data-operation="/">&divide;</button>
                                <button class="calc-button operator" data-operation="mod">mod</button>
                            </div>
                            
                            <!-- Numbers and basic operations -->
                            <div class="button-row">
                                <button class="calc-button number" data-number="7">7</button>
                                <button class="calc-button number" data-number="8">8</button>
                                <button class="calc-button number" data-number="9">9</button>
                                <button class="calc-button operator" data-operation="*">&times;</button>
                                <button class="calc-button scientific" data-function="reciprocal">1/x</button>
                                <button class="calc-button scientific" data-function="square">x&sup2;</button>
                            </div>
                            
                            <div class="button-row">
                                <button class="calc-button number" data-number="4">4</button>
                                <button class="calc-button number" data-number="5">5</button>
                                <button class="calc-button number" data-number="6">6</button>
                                <button class="calc-button operator" data-operation="-">&minus;</button>
                                <button class="calc-button operator" data-operation="(">(</button>
                                <button class="calc-button operator" data-operation=")">)</button>
                            </div>
                            
                            <div class="button-row">
                                <button class="calc-button number" data-number="1">1</button>
                                <button class="calc-button number" data-number="2">2</button>
                                <button class="calc-button number" data-number="3">3</button>
                                <button class="calc-button operator" data-operation="+">+</button>
                                <button class="calc-button number" data-action="decimal">.</button>
                                <button class="calc-button equals" data-action="equals">=</button>
                            </div>
                            
                            <div class="button-row">
                                <button class="calc-button number zero" data-number="0" style="grid-column: span 2;">0</button>
                            </div>
                        </div>
                        
                        <div class="calculator-footer">
                            <div class="memory-indicator" id="memory-indicator" style="opacity: 0;">M</div>
                        </div>
                    </div>
                    
                    <div class="calculator-right history-panel" id="history-panel" style="display: none;">
                        <div class="history-header">
                            <h3>History</h3>
                            <button class="history-clear" data-action="clear-history">Clear</button>
                        </div>
                        <div class="history-list" id="history-list">
                            <div class="history-empty">No calculations yet</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .calculator-window {
                    height: 100%;
                    background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
                    display: flex;
                    flex-direction: column;
                    padding: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    box-sizing: border-box;
                    overflow: hidden;
                }

                .calculator-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    padding: 0 4px;
                }

                .history-toggle {
                    background: #007AFF;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .history-toggle:hover {
                    background: #0056b3;
                }

                .angle-mode {
                    display: flex;
                    gap: 4px;
                }

                .angle-button {
                    background: #e0e0e0;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .angle-button.active {
                    background: #007AFF;
                    color: white;
                }

                .calculator-main {
                    display: flex;
                    flex: 1;
                    gap: 12px;
                }

                .calculator-left {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                }

                .calculator-display {
                    background: #000;
                    color: white;
                    padding: 14px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    min-height: 60px;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3);
                }

                .display-secondary {
                    font-size: 12px;
                    color: #888;
                    text-align: right;
                    margin-bottom: 2px;
                    min-height: 14px;
                }

                .display-primary {
                    font-size: 24px;
                    font-weight: bold;
                    text-align: right;
                    font-family: 'SF Mono', Monaco, monospace;
                    word-break: break-all;
                }

                .calculator-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    flex: 1;
                }

                .button-row {
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 6px;
                    align-items: stretch;
                }

                .calc-button {
                    height: 38px;
                    border: none;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.1s ease;
                    user-select: none;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .calc-button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .calc-button:active {
                    transform: translateY(0);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                }

                .calc-button.number {
                    background: linear-gradient(145deg, #ffffff, #e0e0e0);
                    color: #333;
                }

                .calc-button.number.zero {
                    grid-column: span 2;
                }

                .calc-button.operator {
                    background: linear-gradient(145deg, #FF9500, #e0850d);
                    color: white;
                    font-weight: 600;
                }

                .calc-button.scientific {
                    background: linear-gradient(145deg, #4A90E2, #357ABD);
                    color: white;
                    font-size: 11px;
                }

                .calc-button.memory {
                    background: linear-gradient(145deg, #9B59B6, #8E44AD);
                    color: white;
                    font-size: 11px;
                }

                .calc-button.constant {
                    background: linear-gradient(145deg, #27AE60, #219A52);
                    color: white;
                    font-weight: 600;
                }

                .calc-button.clear {
                    background: linear-gradient(145deg, #E74C3C, #C0392B);
                    color: white;
                    font-weight: 600;
                }

                .calc-button.equals {
                    background: linear-gradient(145deg, #FF9500, #e0850d);
                    color: white;
                    font-weight: bold;
                    font-size: 16px;
                }

                .calculator-footer {
                    margin-top: 8px;
                    display: flex;
                    justify-content: center;
                }

                .memory-indicator {
                    background: #9B59B6;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    transition: opacity 0.3s;
                }

                .history-panel {
                    width: 160px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .history-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                    padding-bottom: 6px;
                    border-bottom: 1px solid #ddd;
                }

                .history-header h3 {
                    margin: 0;
                    font-size: 14px;
                    color: #333;
                }

                .history-clear {
                    background: #E74C3C;
                    color: white;
                    border: none;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                }

                .history-list {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 400px;
                }

                .history-item {
                    padding: 8px;
                    margin-bottom: 4px;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border: 1px solid #e0e0e0;
                }

                .history-item:hover {
                    background: #f5f5f5;
                }

                .history-expression {
                    font-size: 12px;
                    color: #666;
                    margin-bottom: 2px;
                }

                .history-result {
                    font-size: 14px;
                    font-weight: bold;
                    color: #333;
                }

                .history-empty {
                    text-align: center;
                    color: #888;
                    font-style: italic;
                    padding: 20px;
                    font-size: 14px;
                }

                @media (max-width: 600px) {
                    .calculator-main {
                        flex-direction: column;
                    }
                    
                    .history-panel {
                        width: 100%;
                        height: 200px;
                    }
                    
                    .button-row {
                        grid-template-columns: repeat(4, 1fr);
                    }
                    
                    .calc-button.scientific,
                    .calc-button.memory,
                    .calc-button.constant {
                        font-size: 11px;
                    }
                }
            </style>
        `;
    }

    setupCalculatorWindow(windowId) {
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        if (!windowElement) return;

        const state = this.windows.get(windowId);
        const primaryDisplay = windowElement.querySelector('#primary-display');
        const secondaryDisplay = windowElement.querySelector('#secondary-display');
        const memoryIndicator = windowElement.querySelector('#memory-indicator');
        const historyPanel = windowElement.querySelector('#history-panel');
        const historyList = windowElement.querySelector('#history-list');

        // Button event handlers
        windowElement.addEventListener('click', (e) => {
            const button = e.target.closest('.calc-button, .history-toggle, .angle-button, .history-clear, .history-item');
            if (!button) return;

            if (button.classList.contains('history-toggle')) {
                this.toggleHistory(windowId);
            } else if (button.classList.contains('angle-button')) {
                this.setAngleMode(windowId, button.dataset.mode);
            } else if (button.classList.contains('history-clear')) {
                this.clearHistory(windowId);
            } else if (button.classList.contains('history-item')) {
                this.selectHistoryItem(windowId, button.dataset.result);
            } else if (button.dataset.number !== undefined) {
                this.inputNumber(windowId, button.dataset.number);
            } else if (button.dataset.operation) {
                this.inputOperation(windowId, button.dataset.operation);
            } else if (button.dataset.function) {
                this.inputFunction(windowId, button.dataset.function);
            } else if (button.dataset.value) {
                this.inputConstant(windowId, button.dataset.value);
            } else if (button.dataset.action) {
                this.handleAction(windowId, button.dataset.action);
            }
        });

        // Keyboard support
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeyboard(windowId, e);
        });

        // Make window focusable for keyboard events
        windowElement.tabIndex = 0;
        windowElement.focus();
    }

    inputNumber(windowId, number) {
        const state = this.windows.get(windowId);
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const primaryDisplay = windowElement.querySelector('#primary-display');

        if (state.waitingForNewValue) {
            state.display = number;
            state.waitingForNewValue = false;
        } else {
            state.display = state.display === '0' ? number : state.display + number;
        }

        primaryDisplay.textContent = this.formatDisplay(state.display);
    }

    inputOperation(windowId, operation) {
        const state = this.windows.get(windowId);
        const inputValue = parseFloat(state.display);

        if (state.previousValue === null) {
            state.previousValue = inputValue;
        } else if (state.operation) {
            const currentValue = state.previousValue || 0;
            const result = this.performOperation(currentValue, inputValue, state.operation);
            
            state.display = result.toString();
            state.previousValue = result;
            
            this.updateDisplay(windowId);
            this.addToHistory(windowId, `${currentValue} ${this.getOperationSymbol(state.operation)} ${inputValue}`, result);
        }

        state.operation = operation;
        state.waitingForNewValue = true;
        this.updateSecondaryDisplay(windowId);
    }

    inputFunction(windowId, func) {
        const state = this.windows.get(windowId);
        const value = parseFloat(state.display);
        let result;

        try {
            result = this.calculateFunction(value, func, state.angleMode);
            state.display = result.toString();
            state.waitingForNewValue = true;
            
            this.updateDisplay(windowId);
            this.addToHistory(windowId, `${func}(${value})`, result);
        } catch (error) {
            this.showError(windowId, 'Error');
        }
    }

    inputConstant(windowId, constant) {
        const state = this.windows.get(windowId);
        let value;

        switch (constant) {
            case 'pi':
                value = Math.PI;
                break;
            case 'e':
                value = Math.E;
                break;
            default:
                return;
        }

        state.display = value.toString();
        state.waitingForNewValue = true;
        this.updateDisplay(windowId);
    }

    handleAction(windowId, action) {
        const state = this.windows.get(windowId);

        switch (action) {
            case 'clear':
                state.display = '0';
                break;
            case 'all-clear':
                state.display = '0';
                state.previousValue = null;
                state.operation = null;
                state.waitingForNewValue = false;
                this.updateSecondaryDisplay(windowId);
                break;
            case 'decimal':
                if (state.display.indexOf('.') === -1) {
                    state.display += '.';
                }
                break;
            case 'sign':
                if (state.display !== '0') {
                    state.display = state.display.startsWith('-') 
                        ? state.display.slice(1) 
                        : '-' + state.display;
                }
                break;
            case 'equals':
                this.calculate(windowId);
                break;
            case 'memory-clear':
                state.memory = 0;
                this.updateMemoryIndicator(windowId);
                break;
            case 'memory-recall':
                state.display = state.memory.toString();
                state.waitingForNewValue = true;
                break;
            case 'memory-add':
                state.memory += parseFloat(state.display);
                this.updateMemoryIndicator(windowId);
                break;
            case 'memory-subtract':
                state.memory -= parseFloat(state.display);
                this.updateMemoryIndicator(windowId);
                break;
        }

        this.updateDisplay(windowId);
    }

    calculate(windowId) {
        const state = this.windows.get(windowId);
        
        if (state.operation && state.previousValue !== null) {
            const currentValue = parseFloat(state.display);
            const result = this.performOperation(state.previousValue, currentValue, state.operation);
            
            this.addToHistory(windowId, `${state.previousValue} ${this.getOperationSymbol(state.operation)} ${currentValue}`, result);
            
            state.display = result.toString();
            state.previousValue = null;
            state.operation = null;
            state.waitingForNewValue = true;
            
            this.updateDisplay(windowId);
            this.updateSecondaryDisplay(windowId);
        }
    }

    performOperation(prev, current, operation) {
        switch (operation) {
            case '+': return prev + current;
            case '-': return prev - current;
            case '*': return prev * current;
            case '/': 
                if (current === 0) throw new Error('Division by zero');
                return prev / current;
            case '^': return Math.pow(prev, current);
            case 'mod': return prev % current;
            case 'root': return Math.pow(prev, 1/current);
            default: return current;
        }
    }

    calculateFunction(value, func, angleMode) {
        // Convert degrees to radians if needed
        const toRadians = (deg) => angleMode === 'deg' ? deg * Math.PI / 180 : deg;
        const toDegrees = (rad) => angleMode === 'deg' ? rad * 180 / Math.PI : rad;

        switch (func) {
            case 'sin': return Math.sin(toRadians(value));
            case 'cos': return Math.cos(toRadians(value));
            case 'tan': return Math.tan(toRadians(value));
            case 'asin': return toDegrees(Math.asin(value));
            case 'acos': return toDegrees(Math.acos(value));
            case 'atan': return toDegrees(Math.atan(value));
            case 'log': return Math.log10(value);
            case 'ln': return Math.log(value);
            case 'exp': return Math.exp(value);
            case 'sqrt': return Math.sqrt(value);
            case 'square': return value * value;
            case 'reciprocal': 
                if (value === 0) throw new Error('Division by zero');
                return 1 / value;
            case 'factorial':
                if (value < 0 || !Number.isInteger(value)) throw new Error('Invalid input');
                let result = 1;
                for (let i = 2; i <= value; i++) result *= i;
                return result;
            default: return value;
        }
    }

    getOperationSymbol(operation) {
        const symbols = {
            '+': '+', '-': '−', '*': '×', '/': '÷', 
            '^': '^', 'mod': 'mod', 'root': '√'
        };
        return symbols[operation] || operation;
    }

    formatDisplay(value) {
        if (typeof value === 'string') value = parseFloat(value);
        if (isNaN(value)) return 'Error';
        
        // Handle very large or very small numbers
        if (Math.abs(value) > 1e15 || (Math.abs(value) < 1e-10 && value !== 0)) {
            return value.toExponential(6);
        }
        
        // Format to remove unnecessary decimal places
        return parseFloat(value.toPrecision(12)).toString();
    }

    updateDisplay(windowId) {
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const state = this.windows.get(windowId);
        const primaryDisplay = windowElement.querySelector('#primary-display');
        
        primaryDisplay.textContent = this.formatDisplay(state.display);
    }

    updateSecondaryDisplay(windowId) {
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const state = this.windows.get(windowId);
        const secondaryDisplay = windowElement.querySelector('#secondary-display');
        
        if (state.operation && state.previousValue !== null) {
            secondaryDisplay.textContent = `${state.previousValue} ${this.getOperationSymbol(state.operation)}`;
        } else {
            secondaryDisplay.textContent = '';
        }
    }

    updateMemoryIndicator(windowId) {
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const state = this.windows.get(windowId);
        const indicator = windowElement.querySelector('#memory-indicator');
        
        indicator.style.opacity = state.memory !== 0 ? '1' : '0';
    }

    setAngleMode(windowId, mode) {
        const state = this.windows.get(windowId);
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        
        state.angleMode = mode;
        
        // Update button states
        windowElement.querySelectorAll('.angle-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
    }

    toggleHistory(windowId) {
        const state = this.windows.get(windowId);
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const historyPanel = windowElement.querySelector('#history-panel');
        
        state.showHistory = !state.showHistory;
        historyPanel.style.display = state.showHistory ? 'flex' : 'none';
    }

    addToHistory(windowId, expression, result) {
        const state = this.windows.get(windowId);
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const historyList = windowElement.querySelector('#history-list');
        
        state.history.unshift({ expression, result });
        
        // Keep only last 50 calculations
        if (state.history.length > 50) {
            state.history = state.history.slice(0, 50);
        }
        
        this.updateHistoryDisplay(windowId);
    }

    updateHistoryDisplay(windowId) {
        const state = this.windows.get(windowId);
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const historyList = windowElement.querySelector('#history-list');
        
        if (state.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">No calculations yet</div>';
            return;
        }
        
        historyList.innerHTML = state.history.map(item => `
            <div class="history-item" data-result="${item.result}">
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">= ${this.formatDisplay(item.result)}</div>
            </div>
        `).join('');
    }

    clearHistory(windowId) {
        const state = this.windows.get(windowId);
        state.history = [];
        this.updateHistoryDisplay(windowId);
    }

    selectHistoryItem(windowId, result) {
        const state = this.windows.get(windowId);
        state.display = result;
        state.waitingForNewValue = true;
        this.updateDisplay(windowId);
    }

    showError(windowId, message) {
        const windowElement = document.querySelector(`[data-window-id="${windowId}"]`);
        const primaryDisplay = windowElement.querySelector('#primary-display');
        
        primaryDisplay.textContent = message;
        
        // Clear error after 2 seconds
        setTimeout(() => {
            const state = this.windows.get(windowId);
            state.display = '0';
            state.previousValue = null;
            state.operation = null;
            state.waitingForNewValue = false;
            this.updateDisplay(windowId);
            this.updateSecondaryDisplay(windowId);
        }, 2000);
    }

    handleKeyboard(windowId, event) {
        const key = event.key;
        
        // Prevent default browser shortcuts
        if (event.ctrlKey || event.altKey || event.metaKey) return;
        
        event.preventDefault();
        
        // Number keys
        if (/^[0-9]$/.test(key)) {
            this.inputNumber(windowId, key);
        }
        // Operators
        else if (key === '+') this.inputOperation(windowId, '+');
        else if (key === '-') this.inputOperation(windowId, '-');
        else if (key === '*') this.inputOperation(windowId, '*');
        else if (key === '/') this.inputOperation(windowId, '/');
        else if (key === '^') this.inputOperation(windowId, '^');
        else if (key === '%') this.inputOperation(windowId, 'mod');
        // Actions
        else if (key === '=' || key === 'Enter') this.handleAction(windowId, 'equals');
        else if (key === '.') this.handleAction(windowId, 'decimal');
        else if (key === 'Escape') this.handleAction(windowId, 'all-clear');
        else if (key === 'Backspace') this.handleAction(windowId, 'clear');
        else if (key === 'Delete') this.handleAction(windowId, 'all-clear');
    }
}

// Initialize the calculator app
window.calculatorApp = new CalculatorApp();
