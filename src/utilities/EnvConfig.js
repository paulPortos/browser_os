/**
 * Simple Environment Configuration Loader for Browser Environment
 */
class EnvConfig {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    /**
     * Load configuration from .env file simulation
     * In a browser environment, we'll use embedded config
     */
    loadConfig() {
        // In a real browser deployment, these would be set during build process
        // For development, you can modify these values directly
        this.config = {
            DEVELOPMENT_EMAIL: 'developer@yourdomain.com', // UPDATE THIS!
            EMAILJS_SERVICE_ID: 'your_service_id',
            EMAILJS_TEMPLATE_ID: 'your_template_id',
            EMAILJS_PUBLIC_KEY: 'your_public_key',
            ENABLE_ERROR_REPORTING: true,
            DEBUG_MODE: true
        };

        // Try to load from localStorage override (for testing)
        const storedConfig = localStorage.getItem('browserOS-env-config');
        if (storedConfig) {
            try {
                const parsed = JSON.parse(storedConfig);
                this.config = { ...this.config, ...parsed };
                console.log('📧 Loaded environment config from localStorage override');
            } catch (error) {
                console.warn('Failed to parse stored env config:', error);
            }
        }

        console.log('📧 Environment config loaded:', {
            email: this.config.DEVELOPMENT_EMAIL,
            reporting: this.config.ENABLE_ERROR_REPORTING,
            debug: this.config.DEBUG_MODE
        });
    }

    /**
     * Get configuration value
     */
    get(key) {
        return this.config[key];
    }

    /**
     * Set configuration value (for testing)
     */
    set(key, value) {
        this.config[key] = value;
        
        // Save to localStorage for persistence
        localStorage.setItem('browserOS-env-config', JSON.stringify(this.config));
        console.log(`📧 Updated config: ${key} = ${value}`);
    }

    /**
     * Get all configuration
     */
    getAll() {
        return { ...this.config };
    }
}

// Initialize global env config
window.envConfig = new EnvConfig();
