/**
 * Calculator Application - Simple calculator
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
            options.title || 'Calculator',
            content,
            {
                width: 320,
                height: 480,
                resizable: false,
                ...options
            }
        );

        this.windows.set(windowId, {
            display: '0',
            previousValue: null,
            operation: null,
            waitingForNewValue: false,
            lastOperation: null,
            memory: 0
        });

        this.setupCalculatorWindow(windowId);
        return windowId;
    }

    createCalculatorContent() {
        return `
            <div class="calculator-window">
                <div class="calculator-display">
                    <div class="display-text" id="display">0</div>
                </div>
                
                <div class="calculator-buttons">
                    <!-- Memory and Clear row -->
                    <div class="button-row">
                        <button class="calc-button memory" data-action="memory-clear">MC</button>
                        <button class="calc-button memory" data-action="memory-recall">MR</button>
                        <button class="calc-button memory" data-action="memory-add">M+</button>
                        <button class="calc-button memory" data-action="memory-subtract">M-</button>
                    </div>
                    
                    <!-- First row -->
                    <div class="button-row">
                        <button class="calc-button clear" data-action="all-clear">AC</button>
                        <button class="calc-button clear" data-action="clear">C</button>
                        <button class="calc-button operator" data-action="sign">±</button>
                        <button class="calc-button operator" data-operation="/">÷</button>
                    </div>
                    
                    <!-- Second row -->
                    <div class="button-row">
                        <button class="calc-button number" data-number="7">7</button>
                        <button class="calc-button number" data-number="8">8</button>
                        <button class="calc-button number" data-number="9">9</button>
                        <button class="calc-button operator" data-operation="*">×</button>
                    </div>
                    
                    <!-- Third row -->
                    <div class="button-row">
                        <button class="calc-button number" data-number="4">4</button>
                        <button class="calc-button number" data-number="5">5</button>
                        <button class="calc-button number" data-number="6">6</button>
                        <button class="calc-button operator" data-operation="-">−</button>
                    </div>
                    
                    <!-- Fourth row -->
                    <div class="button-row">
                        <button class="calc-button number" data-number="1">1</button>
                        <button class="calc-button number" data-number="2">2</button>
                        <button class="calc-button number" data-number="3">3</button>
                        <button class="calc-button operator" data-operation="+">+</button>
                    </div>
                    
                    <!-- Fifth row -->
                    <div class="button-row">
                        <button class="calc-button number zero" data-number="0">0</button>
                        <button class="calc-button number" data-action="decimal">.</button>
                        <button class="calc-button equals" data-action="equals">=</button>
                    </div>
                </div>
                
                <div class="calculator-footer">
                    <div class="memory-indicator" id="memory-indicator" style="opacity: 0;">M</div>
                </div>
            </div>
            
            <style>
                .calculator-window {
                    height: 100%;
                    background: linear-gradient(145deg, #f0f0f0, #d0d0d0);
                    display: flex;
                    flex-direction: column;
                    padding: 16px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                }
                
                .calculator-display {
                    background: #000;
                    border-radius: 8px;
                    padding: 20px 16px;
                    margin-bottom: 16px;
                    text-align: right;
                    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
                }
                
                .display-text {
                    color: #00ff00;
                    font-size: 36px;
                    font-weight: 300;
                    font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
                    min-height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    overflow: hidden;
                    text-shadow: 0 0 8px #00ff0080;
                }
                
                .calculator-buttons {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .button-row {
                    display: flex;
                    gap: 8px;
                    flex: 1;
                }
                
                .calc-button {
                    flex: 1;
                    border: none;
                    border-radius: 8px;
                    font-size: 20px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.1s ease;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    user-select: none;
                }
                
                .calc-button:active {
                    transform: translateY(1px);
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
                }
                
                .calc-button.number {
                    background: linear-gradient(145deg, #ffffff, #e8e8e8);
                    color: #333;
                    border: 1px solid #ccc;
                }
                
                .calc-button.number:hover {
                    background: linear-gradient(145deg, #f8f8f8, #e0e0e0);
                }
                
                .calc-button.operator {
                    background: linear-gradient(145deg, #ff9500, #e6850e);
                    color: white;
                    border: 1px solid #cc7700;
                }
                
                .calc-button.operator:hover {
                    background: linear-gradient(145deg, #ffad33, #e6850e);
                }
                
                .calc-button.operator.active {
                    background: linear-gradient(145deg, #ffffff, #e8e8e8);
                    color: #ff9500;
                }
                
                .calc-button.equals {
                    background: linear-gradient(145deg, #ff9500, #e6850e);
                    color: white;
                    border: 1px solid #cc7700;
                    flex: 2;
                }
                
                .calc-button.equals:hover {
                    background: linear-gradient(145deg, #ffad33, #e6850e);
                }
                
                .calc-button.clear {
                    background: linear-gradient(145deg, #a6a6a6, #8a8a8a);
                    color: white;
                    border: 1px solid #777;
                }
                
                .calc-button.clear:hover {
                    background: linear-gradient(145deg, #b3b3b3, #8a8a8a);
                }
                
                .calc-button.memory {
                    background: linear-gradient(145deg, #6c6c6c, #555);
                    color: white;
                    border: 1px solid #444;
                    font-size: 14px;
                }
                
                .calc-button.memory:hover {
                    background: linear-gradient(145deg, #777, #555);
                }
                
                .calc-button.zero {
                    flex: 2;
                }
                
                .calculator-footer {
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 8px;
                }
                
                .memory-indicator {
                    background: #ff9500;
                    color: white;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    transition: opacity 0.3s ease;
                }
            </style>
        `;
    }

    setupCalculatorWindow(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        
        // Add click handlers for all buttons
        const buttons = windowElement.querySelectorAll('.calc-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                this.handleButtonClick(windowId, button);
            });
        });
        
        // Add keyboard support
        windowElement.addEventListener('keydown', (e) => {
            this.handleKeyDown(windowId, e);
        });
        
        // Make window focusable for keyboard events
        windowElement.setAttribute('tabindex', '0');
        windowElement.focus();
    }

    handleButtonClick(windowId, button) {
        const windowData = this.windows.get(windowId);
        
        if (button.dataset.number !== undefined) {
            this.inputNumber(windowId, button.dataset.number);
        } else if (button.dataset.operation) {
            this.inputOperation(windowId, button.dataset.operation);
        } else if (button.dataset.action) {
            this.handleAction(windowId, button.dataset.action);
        }
        
        this.updateDisplay(windowId);
        this.updateMemoryIndicator(windowId);
    }

    handleKeyDown(windowId, event) {
        event.preventDefault();
        
        const key = event.key;
        
        if (key >= '0' && key <= '9') {
            this.inputNumber(windowId, key);
        } else if (key === '.') {
            this.handleAction(windowId, 'decimal');
        } else if (key === '+') {
            this.inputOperation(windowId, '+');
        } else if (key === '-') {
            this.inputOperation(windowId, '-');
        } else if (key === '*') {
            this.inputOperation(windowId, '*');
        } else if (key === '/') {
            this.inputOperation(windowId, '/');
        } else if (key === 'Enter' || key === '=') {
            this.handleAction(windowId, 'equals');
        } else if (key === 'Escape') {
            this.handleAction(windowId, 'all-clear');
        } else if (key === 'Backspace') {
            this.handleAction(windowId, 'clear');
        }
        
        this.updateDisplay(windowId);
        this.updateMemoryIndicator(windowId);
    }

    inputNumber(windowId, digit) {
        const windowData = this.windows.get(windowId);
        
        if (windowData.waitingForNewValue) {
            windowData.display = digit;
            windowData.waitingForNewValue = false;
        } else {
            windowData.display = windowData.display === '0' ? digit : windowData.display + digit;
        }
        
        // Limit display length
        if (windowData.display.length > 12) {
            windowData.display = windowData.display.substring(0, 12);
        }
    }

    inputOperation(windowId, operation) {
        const windowData = this.windows.get(windowId);
        const currentValue = parseFloat(windowData.display);
        
        if (windowData.previousValue === null) {
            windowData.previousValue = currentValue;
        } else if (windowData.operation) {
            const result = this.calculate(windowData.previousValue, currentValue, windowData.operation);
            windowData.display = this.formatNumber(result);
            windowData.previousValue = result;
        }
        
        windowData.operation = operation;
        windowData.waitingForNewValue = true;
        
        // Visual feedback for active operation
        this.highlightOperation(windowId, operation);
    }

    handleAction(windowId, action) {
        const windowData = this.windows.get(windowId);
        
        switch (action) {
            case 'equals':
                if (windowData.operation && windowData.previousValue !== null) {
                    const currentValue = parseFloat(windowData.display);
                    const result = this.calculate(windowData.previousValue, currentValue, windowData.operation);
                    windowData.display = this.formatNumber(result);
                    windowData.lastOperation = {
                        operation: windowData.operation,
                        value: currentValue
                    };
                    windowData.previousValue = null;
                    windowData.operation = null;
                    windowData.waitingForNewValue = true;
                } else if (windowData.lastOperation) {
                    // Repeat last operation
                    const currentValue = parseFloat(windowData.display);
                    const result = this.calculate(currentValue, windowData.lastOperation.value, windowData.lastOperation.operation);
                    windowData.display = this.formatNumber(result);
                    windowData.waitingForNewValue = true;
                }
                break;
                
            case 'all-clear':
                windowData.display = '0';
                windowData.previousValue = null;
                windowData.operation = null;
                windowData.waitingForNewValue = false;
                windowData.lastOperation = null;
                break;
                
            case 'clear':
                if (windowData.display !== '0') {
                    windowData.display = windowData.display.length > 1 ? 
                        windowData.display.slice(0, -1) : '0';
                }
                break;
                
            case 'sign':
                const currentValue = parseFloat(windowData.display);
                windowData.display = this.formatNumber(-currentValue);
                break;
                
            case 'decimal':
                if (!windowData.display.includes('.')) {
                    if (windowData.waitingForNewValue) {
                        windowData.display = '0.';
                        windowData.waitingForNewValue = false;
                    } else {
                        windowData.display += '.';
                    }
                }
                break;
                
            case 'memory-clear':
                windowData.memory = 0;
                break;
                
            case 'memory-recall':
                windowData.display = this.formatNumber(windowData.memory);
                windowData.waitingForNewValue = true;
                break;
                
            case 'memory-add':
                windowData.memory += parseFloat(windowData.display);
                break;
                
            case 'memory-subtract':
                windowData.memory -= parseFloat(windowData.display);
                break;
        }
        
        this.clearOperationHighlight(windowId);
    }

    calculate(a, b, operation) {
        switch (operation) {
            case '+':
                return a + b;
            case '-':
                return a - b;
            case '*':
                return a * b;
            case '/':
                if (b === 0) {
                    throw new Error('Division by zero');
                }
                return a / b;
            default:
                return b;
        }
    }

    formatNumber(number) {
        if (isNaN(number) || !isFinite(number)) {
            return 'Error';
        }
        
        // Handle very large or very small numbers
        if (Math.abs(number) > 999999999999) {
            return number.toExponential(6);
        }
        
        if (Math.abs(number) < 0.000000000001 && number !== 0) {
            return number.toExponential(6);
        }
        
        // Format with appropriate decimal places
        let formatted = number.toString();
        
        if (formatted.includes('.')) {
            // Remove trailing zeros
            formatted = formatted.replace(/\.?0+$/, '');
        }
        
        // Limit length
        if (formatted.length > 12) {
            const parts = formatted.split('.');
            if (parts.length > 1) {
                const decimalPlaces = 12 - parts[0].length - 1;
                if (decimalPlaces > 0) {
                    formatted = number.toFixed(decimalPlaces);
                } else {
                    formatted = Math.round(number).toString();
                }
            }
        }
        
        return formatted;
    }

    updateDisplay(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const display = windowElement.querySelector('#display');
        const windowData = this.windows.get(windowId);
        
        display.textContent = windowData.display;
        
        // Adjust font size for long numbers
        if (windowData.display.length > 8) {
            display.style.fontSize = '24px';
        } else if (windowData.display.length > 6) {
            display.style.fontSize = '30px';
        } else {
            display.style.fontSize = '36px';
        }
    }

    updateMemoryIndicator(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const indicator = windowElement.querySelector('#memory-indicator');
        const windowData = this.windows.get(windowId);
        
        indicator.style.opacity = windowData.memory !== 0 ? '1' : '0';
    }

    highlightOperation(windowId, operation) {
        const windowElement = windowManager.getWindow(windowId).element;
        
        // Clear previous highlights
        this.clearOperationHighlight(windowId);
        
        // Highlight current operation
        const operatorButton = windowElement.querySelector(`[data-operation="${operation}"]`);
        if (operatorButton) {
            operatorButton.classList.add('active');
        }
    }

    clearOperationHighlight(windowId) {
        const windowElement = windowManager.getWindow(windowId).element;
        const operatorButtons = windowElement.querySelectorAll('.calc-button.operator');
        operatorButtons.forEach(button => button.classList.remove('active'));
    }
}

// Initialize Calculator app
window.calculatorApp = new CalculatorApp();
