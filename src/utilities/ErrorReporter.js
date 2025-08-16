/**
 * Error Reporter - Handles system error reporting and user feedback
 */
class ErrorReporter {
    constructor() {
        this.config = this.loadConfig();
        this.init();
    }

    /**
     * Load configuration from environment
     */
    loadConfig() {
        // Use EnvConfig if available, otherwise fallback to defaults
        if (window.envConfig) {
            return {
                DEVELOPMENT_EMAIL: window.envConfig.get('DEVELOPMENT_EMAIL'),
                EMAILJS_SERVICE_ID: window.envConfig.get('EMAILJS_SERVICE_ID'),
                EMAILJS_TEMPLATE_ID: window.envConfig.get('EMAILJS_TEMPLATE_ID'),
                EMAILJS_PUBLIC_KEY: window.envConfig.get('EMAILJS_PUBLIC_KEY'),
                ENABLE_ERROR_REPORTING: window.envConfig.get('ENABLE_ERROR_REPORTING'),
                DEBUG_MODE: window.envConfig.get('DEBUG_MODE')
            };
        }
        
        // Fallback configuration
        return {
            DEVELOPMENT_EMAIL: 'developer@yourdomain.com',
            EMAILJS_SERVICE_ID: 'your_service_id',
            EMAILJS_TEMPLATE_ID: 'your_template_id', 
            EMAILJS_PUBLIC_KEY: 'your_public_key',
            ENABLE_ERROR_REPORTING: true,
            DEBUG_MODE: true
        };
    }

    /**
     * Initialize error reporter
     */
    init() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleError({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                type: 'JavaScript Error',
                timestamp: new Date().toISOString()
            });
        });

        // Promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                message: event.reason?.message || 'Unhandled Promise Rejection',
                error: event.reason,
                type: 'Promise Rejection',
                timestamp: new Date().toISOString()
            });
        });

        console.log('🛡️ ErrorReporter initialized');
    }

    /**
     * Handle error and show error dialog
     */
    handleError(errorData) {
        console.error('💥 System Error Detected:', errorData);
        
        // Store error for reporting
        this.currentError = errorData;
        
        // Show error dialog
        this.showErrorDialog(errorData);
    }

    /**
     * Show error dialog with report button
     */
    showErrorDialog(errorData) {
        // Create error dialog overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ff6b6b;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 32px;
            max-width: 700px;
            width: 90%;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
            border: 2px solid rgba(255,255,255,0.8);
        `;

        const errorIcon = errorData.type === 'JavaScript Error' ? '⚠️' : '💥';
        
        dialog.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px; animation: pulse 2s infinite;">${errorIcon}</div>
                <h1 style="margin: 0; color: #d73502; font-size: 32px; font-weight: 300;">Critical System Error</h1>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 18px; font-weight: 500;">${errorData.type}</p>
            </div>
            
            <div style="background: rgba(215, 53, 2, 0.1); border: 2px solid #d73502; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #d73502; display: flex; align-items: center; gap: 8px;">
                    🔍 Error Details
                </h3>
                <div style="font-family: 'Courier New', monospace; font-size: 14px; color: #d73502; word-break: break-all; line-height: 1.4;">
                    ${this.formatErrorMessage(errorData)}
                </div>
            </div>
            
            <div style="background: rgba(255, 193, 7, 0.15); border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 16px; color: #856404; line-height: 1.5;">
                    <strong style="color: #d73502;">⚡ System Failure Detected</strong><br>
                    BrowserOS encountered a critical error that prevented normal operation. 
                    This error has been logged and system recovery options are available below.
                </p>
            </div>
            
            <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <button id="error-reload" style="
                    padding: 16px 32px;
                    background: linear-gradient(135deg, #007AFF, #0056CC);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3);
                    transition: all 0.2s ease;
                ">🔄 Emergency Restart</button>
                
                <button id="error-report" style="
                    padding: 16px 32px;
                    background: linear-gradient(135deg, #FF3B30, #CC1E14);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(255, 59, 48, 0.3);
                    transition: all 0.2s ease;
                ">🚨 Report Critical Error</button>
                
                <button id="error-dismiss" style="
                    padding: 16px 32px;
                    background: rgba(142, 142, 147, 0.8);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    font-size: 18px;
                    font-weight: 600;
                    box-shadow: 0 4px 15px rgba(142, 142, 147, 0.2);
                    transition: all 0.2s ease;
                ">⚠️ Continue Anyway</button>
            </div>
            
            <div id="report-status" style="
                margin-top: 20px;
                padding: 16px;
                border-radius: 10px;
                text-align: center;
                display: none;
                font-size: 16px;
                font-weight: 500;
            "></div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                #error-reload:hover, #error-report:hover, #error-dismiss:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }
            </style>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // Event listeners
        document.getElementById('error-reload').addEventListener('click', () => {
            window.location.reload();
        });

        document.getElementById('error-report').addEventListener('click', () => {
            this.reportError(errorData);
        });

        document.getElementById('error-dismiss').addEventListener('click', () => {
            overlay.remove();
        });

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    /**
     * Format error message for display
     */
    formatErrorMessage(errorData) {
        let message = errorData.message || 'Unknown error';
        
        if (errorData.filename) {
            message += `\n\nFile: ${errorData.filename}`;
        }
        
        if (errorData.lineno) {
            message += `\nLine: ${errorData.lineno}`;
        }
        
        if (errorData.colno) {
            message += `\nColumn: ${errorData.colno}`;
        }
        
        if (errorData.error?.stack) {
            message += `\n\nStack Trace:\n${errorData.error.stack}`;
        }
        
        return message.replace(/\n/g, '<br>');
    }

    /**
     * Report error via email
     */
    async reportError(errorData) {
        const statusElement = document.getElementById('report-status');
        statusElement.style.display = 'block';
        statusElement.style.background = '#fff3cd';
        statusElement.style.color = '#856404';
        statusElement.innerHTML = '📧 Sending error report...';

        try {
            // Collect system information
            const systemInfo = this.collectSystemInfo();
            
            // Prepare error report
            const errorReport = {
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href,
                systemInfo: systemInfo,
                errorData: errorData,
                browserOS_version: window.browserOS?.version || '1.0.0'
            };

            // Attempt to send via different methods
            const success = await this.sendErrorReport(errorReport);
            
            if (success) {
                statusElement.style.background = '#d1edff';
                statusElement.style.color = '#0c5aa6';
                statusElement.innerHTML = '✅ Error report sent successfully! Thank you for helping improve BrowserOS.';
            } else {
                throw new Error('Failed to send report');
            }
            
        } catch (error) {
            console.error('Failed to send error report:', error);
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
            statusElement.innerHTML = `❌ Failed to send report. You can manually report this issue to: ${this.config.DEVELOPMENT_EMAIL}`;
        }
    }

    /**
     * Send error report via multiple methods
     */
    async sendErrorReport(errorReport) {
        // Method 1: Try EmailJS if configured
        if (this.config.EMAILJS_SERVICE_ID !== 'your_service_id') {
            try {
                return await this.sendViaEmailJS(errorReport);
            } catch (error) {
                console.warn('EmailJS failed:', error);
            }
        }

        // Method 2: Try FormSubmit (free service)
        try {
            return await this.sendViaFormSubmit(errorReport);
        } catch (error) {
            console.warn('FormSubmit failed:', error);
        }

        // Method 3: Try Formspree (free service)
        try {
            return await this.sendViaFormspree(errorReport);
        } catch (error) {
            console.warn('Formspree failed:', error);
        }

        // Method 4: Download as file for manual sending
        this.downloadErrorReport(errorReport);
        return true;
    }

    /**
     * Send via EmailJS service
     */
    async sendViaEmailJS(errorReport) {
        // This would require EmailJS library to be loaded
        // For now, we'll simulate the API call
        throw new Error('EmailJS not configured');
    }

    /**
     * Send via FormSubmit service
     */
    async sendViaFormSubmit(errorReport) {
        const response = await fetch('https://formsubmit.co/ajax/' + this.config.DEVELOPMENT_EMAIL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: 'BrowserOS Error Reporter',
                message: `Error Report from BrowserOS\n\n${JSON.stringify(errorReport, null, 2)}`,
                subject: `BrowserOS Error Report - ${errorReport.errorData.type}`,
                _captcha: false
            })
        });
        
        return response.ok;
    }

    /**
     * Send via Formspree service  
     */
    async sendViaFormspree(errorReport) {
        // Would need Formspree endpoint
        throw new Error('Formspree not configured');
    }

    /**
     * Download error report as file for manual sending
     */
    downloadErrorReport(errorReport) {
        const reportContent = `BrowserOS Error Report
Generated: ${new Date().toLocaleString()}
===========================================

${JSON.stringify(errorReport, null, 2)}

Please send this file to: ${this.config.DEVELOPMENT_EMAIL}
`;

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `browserOS-error-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Collect system information
     */
    collectSystemInfo() {
        return {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            window: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            localStorage: {
                available: typeof Storage !== 'undefined',
                used: this.getLocalStorageSize()
            },
            url: window.location.href,
            referrer: document.referrer
        };
    }

    /**
     * Get localStorage usage size
     */
    getLocalStorageSize() {
        try {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += localStorage[key].length + key.length;
                }
            }
            return `${(total / 1024).toFixed(2)} KB`;
        } catch (error) {
            return 'Unable to calculate';
        }
    }

    /**
     * Manually report error (for use in catch blocks)
     */
    reportManualError(error, context = {}) {
        const errorData = {
            message: error.message || String(error),
            error: error,
            type: 'Manual Report',
            context: context,
            timestamp: new Date().toISOString()
        };
        
        this.handleError(errorData);
    }
}

// Initialize error reporter
window.errorReporter = new ErrorReporter();
