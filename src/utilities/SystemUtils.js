/**
 * System Utilities - Common system functions and helpers
 */
class SystemUtils {
    static formatTime(date = new Date()) {
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    static formatSize(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes === 0) return '0 Bytes';
        const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static createElement(tag, className = '', attributes = {}) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        
        Object.keys(attributes).forEach(key => {
            if (key === 'textContent' || key === 'innerHTML') {
                element[key] = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        return element;
    }

    static addEventListeners(element, events) {
        Object.keys(events).forEach(event => {
            element.addEventListener(event, events[event]);
        });
    }

    static removeEventListeners(element, events) {
        Object.keys(events).forEach(event => {
            element.removeEventListener(event, events[event]);
        });
    }

    static getRandomPosition(containerWidth = window.innerWidth, containerHeight = window.innerHeight, objectWidth = 800, objectHeight = 600) {
        const maxX = Math.max(0, containerWidth - objectWidth);
        const maxY = Math.max(50, containerHeight - objectHeight - 80); // Account for menubar and dock
        
        return {
            x: Math.random() * maxX,
            y: 50 + (Math.random() * (maxY - 50))
        };
    }

    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                document.execCommand('copy');
                return Promise.resolve();
            } catch (err) {
                return Promise.reject(err);
            } finally {
                document.body.removeChild(textArea);
            }
        }
    }

    static showNotification(title, message, duration = 3000) {
        const notification = SystemUtils.createElement('div', 'notification', {
            innerHTML: `
                <div class="notification-title">${SystemUtils.sanitizeHTML(title)}</div>
                <div class="notification-message">${SystemUtils.sanitizeHTML(message)}</div>
            `
        });

        document.body.appendChild(notification);
        
        // Trigger show animation
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto-hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);

        return notification;
    }

    static showModal(title, content, buttons = []) {
        return new Promise((resolve) => {
            const overlay = SystemUtils.createElement('div', 'modal-overlay');
            const modal = SystemUtils.createElement('div', 'modal');
            
            const titleElement = SystemUtils.createElement('div', 'modal-title', {
                textContent: title
            });
            
            const contentElement = SystemUtils.createElement('div', 'modal-content', {
                innerHTML: content
            });
            
            const buttonsContainer = SystemUtils.createElement('div', 'modal-buttons');
            
            // Default button if none provided
            if (buttons.length === 0) {
                buttons = [{ text: 'OK', primary: true, value: 'ok' }];
            }
            
            buttons.forEach(buttonConfig => {
                const button = SystemUtils.createElement('button', `modal-button ${buttonConfig.primary ? 'primary' : 'secondary'}`, {
                    textContent: buttonConfig.text
                });
                
                button.addEventListener('click', () => {
                    overlay.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        resolve(buttonConfig.value || buttonConfig.text.toLowerCase());
                    }, 300);
                });
                
                buttonsContainer.appendChild(button);
            });
            
            modal.appendChild(titleElement);
            modal.appendChild(contentElement);
            modal.appendChild(buttonsContainer);
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Show modal
            setTimeout(() => overlay.classList.add('show'), 10);
            
            // Close on overlay click
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        resolve('cancel');
                    }, 300);
                }
            });
        });
    }

    static showContextMenu(x, y, items) {
        // Remove existing context menus
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());
        
        const menu = SystemUtils.createElement('div', 'context-menu');
        
        items.forEach(item => {
            if (item.separator) {
                menu.appendChild(SystemUtils.createElement('div', 'context-menu-separator'));
            } else {
                const menuItem = SystemUtils.createElement('div', `context-menu-item ${item.disabled ? 'disabled' : ''}`, {
                    innerHTML: `${item.icon || ''} ${item.text}`
                });
                
                if (!item.disabled) {
                    menuItem.addEventListener('click', () => {
                        menu.remove();
                        if (item.action) item.action();
                    });
                }
                
                menu.appendChild(menuItem);
            }
        });
        
        // Position menu
        menu.style.left = `${x}px`;
        menu.style.top = `${y}px`;
        
        document.body.appendChild(menu);
        
        // Adjust position if menu goes off-screen
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${y - rect.height}px`;
        }
        
        // Close menu on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => document.addEventListener('click', closeMenu), 10);
        
        return menu;
    }

    static getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            languages: navigator.languages,
            online: navigator.onLine,
            cookieEnabled: navigator.cookieEnabled,
            screenWidth: screen.width,
            screenHeight: screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            memory: navigator.deviceMemory || 'unknown',
            cores: navigator.hardwareConcurrency || 'unknown'
        };
    }

    static getBatteryInfo() {
        if ('getBattery' in navigator) {
            return navigator.getBattery().then(battery => ({
                level: Math.round(battery.level * 100),
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            }));
        }
        return Promise.resolve({
            level: 100,
            charging: false,
            chargingTime: Infinity,
            dischargingTime: Infinity
        });
    }

    static updateDateTime() {
        const now = new Date();
        const dateTimeElement = document.getElementById('datetime');
        if (dateTimeElement) {
            dateTimeElement.textContent = SystemUtils.formatTime(now);
        }
    }

    static startSystemClock() {
        SystemUtils.updateDateTime();
        setInterval(SystemUtils.updateDateTime, 1000);
    }

    static updateBatteryStatus() {
        SystemUtils.getBatteryInfo().then(battery => {
            const batteryElement = document.getElementById('battery-status');
            if (batteryElement) {
                const icon = battery.charging ? '🔌' : (battery.level > 20 ? '🔋' : '🪫');
                batteryElement.textContent = `${icon} ${battery.level}%`;
            }
        });
    }

    static startBatteryMonitor() {
        SystemUtils.updateBatteryStatus();
        setInterval(SystemUtils.updateBatteryStatus, 30000); // Update every 30 seconds
    }
}

// Initialize system utilities
window.systemUtils = SystemUtils;
