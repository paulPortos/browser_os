/**
 * Event Manager - Handles system-wide events and communication
 */
class EventManager {
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} eventName 
     * @param {Function} callback 
     * @param {Object} context 
     */
    on(eventName, callback, context = null) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, []);
        }
        
        this.listeners.get(eventName).push({
            callback,
            context
        });
    }

    /**
     * Unsubscribe from an event
     * @param {string} eventName 
     * @param {Function} callback 
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;
        
        const listeners = this.listeners.get(eventName);
        const index = listeners.findIndex(listener => listener.callback === callback);
        
        if (index > -1) {
            listeners.splice(index, 1);
        }
        
        if (listeners.length === 0) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * Emit an event
     * @param {string} eventName 
     * @param {*} data 
     */
    emit(eventName, data = null) {
        if (!this.listeners.has(eventName)) return;
        
        const listeners = this.listeners.get(eventName);
        listeners.forEach(({ callback, context }) => {
            try {
                if (context) {
                    callback.call(context, data);
                } else {
                    callback(data);
                }
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }

    /**
     * Subscribe to an event once
     * @param {string} eventName 
     * @param {Function} callback 
     * @param {Object} context 
     */
    once(eventName, callback, context = null) {
        const onceCallback = (data) => {
            callback.call(context, data);
            this.off(eventName, onceCallback);
        };
        
        this.on(eventName, onceCallback);
    }

    /**
     * Clear all listeners for an event
     * @param {string} eventName 
     */
    clear(eventName) {
        if (eventName) {
            this.listeners.delete(eventName);
        } else {
            this.listeners.clear();
        }
    }

    /**
     * Get the count of listeners for an event
     * @param {string} eventName 
     * @returns {number}
     */
    listenerCount(eventName) {
        return this.listeners.has(eventName) ? this.listeners.get(eventName).length : 0;
    }

    /**
     * Get all registered event names
     * @returns {Array}
     */
    eventNames() {
        return Array.from(this.listeners.keys());
    }
}

// Create global event manager instance
window.eventManager = new EventManager();
