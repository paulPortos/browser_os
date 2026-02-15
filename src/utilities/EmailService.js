/**
 * EmailService - Sends issue reports from BrowserOS
 * Uses EmailJS (https://www.emailjs.com/) for client-side email delivery.
 * Falls back to FormSubmit (https://formsubmit.co/) if EmailJS is not configured.
 */
class EmailService {
    constructor() {
        this.initRetryCount = 0;
        this.maxRetries = 10;
        this._ready = false;
        this.init();
    }

    init() {
        if (!window.envConfig) {
            if (this.initRetryCount++ < this.maxRetries) {
                setTimeout(() => this.init(), 100);
                return;
            }
            console.error('❌ EmailService: envConfig not available');
            return;
        }
        this._ready = true;
        console.log('📧 EmailService initialized');
    }

    /* -------------------------------------------------------------- */
    /*  Public API                                                     */
    /* -------------------------------------------------------------- */

    /**
     * Send an issue report.
     * @param {{ title: string, category: string, description: string }} report
     * @returns {Promise<void>}
     */
    sendIssueReport(report) {
        if (!this._ready) return Promise.reject(new Error('EmailService not ready'));

        const devEmail = window.envConfig.get('DEV_EMAIL');
        if (!devEmail || devEmail === 'developer@yourdomain.com') {
            return Promise.reject(new Error('DEV_EMAIL is not configured. Update it in System Preferences → General or in EnvConfig.'));
        }

        // Try EmailJS first, fall back to FormSubmit
        const serviceId  = window.envConfig.get('EMAILJS_SERVICE_ID');
        const templateId = window.envConfig.get('EMAILJS_TEMPLATE_ID');
        const publicKey  = window.envConfig.get('EMAILJS_PUBLIC_KEY');
        const emailJSReady = serviceId && templateId && publicKey &&
            serviceId !== 'your_service_id' &&
            templateId !== 'your_template_id' &&
            publicKey !== 'your_public_key';

        if (emailJSReady) {
            return this._sendViaEmailJS(report, { serviceId, templateId, publicKey, devEmail });
        }
        return this._sendViaFormSubmit(report, devEmail);
    }

    /* -------------------------------------------------------------- */
    /*  EmailJS Transport                                              */
    /* -------------------------------------------------------------- */

    _sendViaEmailJS(report, { serviceId, templateId, publicKey, devEmail }) {
        // Dynamically load the EmailJS SDK if not already present
        const load = typeof emailjs !== 'undefined'
            ? Promise.resolve()
            : this._loadScript('https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js');

        return load.then(() => {
            /* global emailjs */
            emailjs.init(publicKey);
            return emailjs.send(serviceId, templateId, {
                to_email: devEmail,
                from_name: 'BrowserOS Bug Reporter',
                subject: `[BrowserOS] ${report.category}: ${report.title}`,
                message: `Category: ${report.category}\nTitle: ${report.title}\n\n${report.description}\n\n— Sent from BrowserOS Report Issue`
            });
        });
    }

    /* -------------------------------------------------------------- */
    /*  FormSubmit Transport (zero-config fallback)                    */
    /* -------------------------------------------------------------- */

    _sendViaFormSubmit(report, devEmail) {
        const payload = {
            _subject: `[BrowserOS] ${report.category}: ${report.title}`,
            Category: report.category,
            Title: report.title,
            Description: report.description,
            _template: 'table',
            _captcha: 'false'
        };

        return fetch(`https://formsubmit.co/ajax/${devEmail}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => {
            if (!res.ok) throw new Error(`FormSubmit responded with ${res.status}`);
            return res.json();
        }).then(data => {
            if (data.success !== 'true' && data.success !== true) {
                throw new Error(data.message || 'FormSubmit rejected the request');
            }
        });
    }

    /* -------------------------------------------------------------- */
    /*  Helpers                                                        */
    /* -------------------------------------------------------------- */

    _loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load EmailJS SDK'));
            document.head.appendChild(s);
        });
    }
}

// Initialize global email service
window.emailService = new EmailService();
