/**
 * Responsive Manager - Handles dynamic responsive behaviors
 */
class ResponsiveManager {
    constructor() {
        this.breakpoints = {
            mobile: 480,
            tablet: 768,
            desktop: 1024,
            large: 1200,
            xlarge: 1600
        };
        
        this.currentBreakpoint = this.getCurrentBreakpoint();
        this.observers = new Set();
        
        this.init();
    }

    init() {
        this.setupMediaQueryListeners();
        this.setupOrientationChange();
        this.setupResizeHandler();
        
        // Initial responsive check
        this.handleBreakpointChange();
    }

    /**
     * Setup media query listeners for different breakpoints
     */
    setupMediaQueryListeners() {
        Object.entries(this.breakpoints).forEach(([name, width]) => {
            const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
            
            mediaQuery.addEventListener('change', (e) => {
                const newBreakpoint = this.getCurrentBreakpoint();
                if (newBreakpoint !== this.currentBreakpoint) {
                    this.currentBreakpoint = newBreakpoint;
                    this.handleBreakpointChange();
                }
            });
        });
    }

    /**
     * Setup orientation change handling
     */
    setupOrientationChange() {
        window.addEventListener('orientationchange', () => {
            // Delay to allow for orientation change to complete
            setTimeout(() => {
                this.handleBreakpointChange();
                eventManager.emit('responsive:orientationchange', {
                    orientation: screen.orientation?.angle || window.orientation || 0
                });
            }, 100);
        });
    }

    /**
     * Setup resize handler with debouncing
     */
    setupResizeHandler() {
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const newBreakpoint = this.getCurrentBreakpoint();
                if (newBreakpoint !== this.currentBreakpoint) {
                    this.currentBreakpoint = newBreakpoint;
                    this.handleBreakpointChange();
                }
                
                eventManager.emit('responsive:resize', {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    breakpoint: this.currentBreakpoint
                });
            }, 150);
        });
    }

    /**
     * Get current breakpoint based on window width
     */
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.mobile) return 'mobile';
        if (width <= this.breakpoints.tablet) return 'tablet';
        if (width <= this.breakpoints.desktop) return 'desktop';
        if (width <= this.breakpoints.large) return 'large';
        return 'xlarge';
    }

    /**
     * Handle breakpoint changes
     */
    handleBreakpointChange() {
        // Update body class for CSS targeting
        document.body.className = document.body.className
            .replace(/breakpoint-\w+/g, '')
            .trim();
        document.body.classList.add(`breakpoint-${this.currentBreakpoint}`);

        // Apply responsive adjustments based on breakpoint
        this.applyResponsiveAdjustments();

        // Emit breakpoint change event
        eventManager.emit('responsive:breakpointchange', {
            breakpoint: this.currentBreakpoint,
            width: window.innerWidth,
            height: window.innerHeight
        });

        // Notify observers
        this.observers.forEach(callback => {
            try {
                callback(this.currentBreakpoint);
            } catch (error) {
                console.error('❌ Responsive observer error:', error);
            }
        });
    }

    /**
     * Apply responsive adjustments based on current breakpoint
     */
    applyResponsiveAdjustments() {
        switch (this.currentBreakpoint) {
            case 'mobile':
                this.applyMobileAdjustments();
                break;
            case 'tablet':
                this.applyTabletAdjustments();
                break;
            case 'desktop':
                this.applyDesktopAdjustments();
                break;
            case 'large':
                this.applyLargeAdjustments();
                break;
            case 'xlarge':
                this.applyXLargeAdjustments();
                break;
        }
    }

    /**
     * Apply mobile-specific adjustments
     */
    applyMobileAdjustments() {
        // Add mobile-specific behaviors
        document.documentElement.style.setProperty('--responsive-scale', '0.8');
        
        // Ensure mobile windows are properly sized
        const windows = document.querySelectorAll('.window');
        windows.forEach(window => {
            if (!window.classList.contains('maximized')) {
                window.style.width = 'calc(100vw - 20px)';
                window.style.height = 'calc(100vh - 120px)';
                window.style.left = '10px';
                window.style.top = 'calc(var(--menubar-height) + 10px)';
            }
        });
    }

    /**
     * Apply tablet-specific adjustments
     */
    applyTabletAdjustments() {
        document.documentElement.style.setProperty('--responsive-scale', '0.9');
    }

    /**
     * Apply desktop-specific adjustments
     */
    applyDesktopAdjustments() {
        document.documentElement.style.setProperty('--responsive-scale', '1');
    }

    /**
     * Apply large screen adjustments
     */
    applyLargeAdjustments() {
        document.documentElement.style.setProperty('--responsive-scale', '1.1');
    }

    /**
     * Apply extra large screen adjustments
     */
    applyXLargeAdjustments() {
        document.documentElement.style.setProperty('--responsive-scale', '1.2');
    }

    /**
     * Check if current viewport matches a specific breakpoint
     */
    isBreakpoint(breakpoint) {
        return this.currentBreakpoint === breakpoint;
    }

    /**
     * Check if current viewport is mobile or smaller
     */
    isMobile() {
        return this.currentBreakpoint === 'mobile';
    }

    /**
     * Check if current viewport is tablet or smaller
     */
    isTablet() {
        return ['mobile', 'tablet'].includes(this.currentBreakpoint);
    }

    /**
     * Check if current viewport is desktop or larger
     */
    isDesktop() {
        return ['desktop', 'large', 'xlarge'].includes(this.currentBreakpoint);
    }

    /**
     * Register observer for breakpoint changes
     */
    observe(callback) {
        this.observers.add(callback);
        
        // Call immediately with current breakpoint
        callback(this.currentBreakpoint);
        
        // Return unsubscribe function
        return () => {
            this.observers.delete(callback);
        };
    }

    /**
     * Get viewport dimensions
     */
    getViewportDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight,
            availableWidth: window.innerWidth,
            availableHeight: window.innerHeight - 100, // Account for menubar/dock
            breakpoint: this.currentBreakpoint
        };
    }

    /**
     * Calculate responsive font size
     */
    getResponsiveFontSize(baseSize, minSize = baseSize * 0.8, maxSize = baseSize * 1.2) {
        const scaleFactor = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--responsive-scale') || '1');
        return Math.max(minSize, Math.min(maxSize, baseSize * scaleFactor));
    }
}

// Create and export global instance
const responsiveManager = new ResponsiveManager();

// Make it globally available
if (typeof window !== 'undefined') {
    window.responsiveManager = responsiveManager;
}
