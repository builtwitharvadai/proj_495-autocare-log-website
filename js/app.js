/**
 * AutoCare Log - Main Application Entry Point
 *
 * This module serves as the primary initialization point for the AutoCare Log application.
 * It coordinates module loading, sets up global event listeners, and handles application lifecycle.
 */

/**
 * Application state
 */
const AppState = {
    isInitialized: false,
    isDOMReady: false,
    modules: new Map()
};

/**
 * Logger utility for structured logging
 */
const Logger = {
    log(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            context
        };

        if (level === 'error') {
            console.error(`[${timestamp}] [${level.toUpperCase()}] ${message}`, context);
        } else if (level === 'warn') {
            console.warn(`[${timestamp}] [${level.toUpperCase()}] ${message}`, context);
        } else {
            console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, context);
        }

        return logEntry;
    },

    info(message, context) {
        return this.log('info', message, context);
    },

    warn(message, context) {
        return this.log('warn', message, context);
    },

    error(message, context) {
        return this.log('error', message, context);
    },

    debug(message, context) {
        return this.log('debug', message, context);
    }
};

/**
 * Error handler for application-level errors
 */
class ErrorHandler {
    constructor() {
        this.errors = [];
        this.setupGlobalHandlers();
    }

    setupGlobalHandlers() {
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                type: 'global',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: 'unhandled_promise_rejection',
                promise: event.promise
            });
        });
    }

    handleError(error, context = {}) {
        const errorInfo = {
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            context,
            timestamp: new Date().toISOString()
        };

        this.errors.push(errorInfo);
        Logger.error(errorInfo.message, errorInfo);

        // Prevent storing too many errors in memory
        if (this.errors.length > 100) {
            this.errors.shift();
        }

        return errorInfo;
    }

    getErrors() {
        return [...this.errors];
    }

    clearErrors() {
        this.errors = [];
    }
}

/**
 * Application initialization
 */
class Application {
    constructor() {
        this.errorHandler = new ErrorHandler();
        this.initPromise = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        if (AppState.isInitialized) {
            Logger.warn('Application already initialized');
            return;
        }

        try {
            Logger.info('Starting application initialization');

            // Wait for DOM to be ready
            await this.waitForDOM();
            AppState.isDOMReady = true;
            Logger.debug('DOM ready');

            // Setup event listeners
            this.setupEventListeners();
            Logger.debug('Event listeners configured');

            // Initialize modules
            await this.initializeModules();
            Logger.debug('Modules initialized');

            // Mark application as initialized
            AppState.isInitialized = true;
            Logger.info('Application initialization complete');

            // Dispatch custom event for application ready
            this.dispatchAppReady();

        } catch (error) {
            this.errorHandler.handleError(error, {
                phase: 'initialization',
                action: 'init'
            });
            throw error;
        }
    }

    /**
     * Wait for DOM to be ready
     */
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    resolve();
                }, { once: true });
            } else {
                // DOM already loaded
                resolve();
            }
        });
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                Logger.debug('Page hidden');
            } else {
                Logger.debug('Page visible');
            }
        });

        // Online/offline status
        window.addEventListener('online', () => {
            Logger.info('Connection restored');
        });

        window.addEventListener('offline', () => {
            Logger.warn('Connection lost');
        });

        // Before unload warning (if needed)
        window.addEventListener('beforeunload', (event) => {
            // Can be used later to warn about unsaved changes
            Logger.debug('Page about to unload');
        });
    }

    /**
     * Initialize application modules
     */
    async initializeModules() {
        Logger.info('Ready to initialize application modules');

        try {
            // Initialize vehicle form component
            await this.initializeVehicleForm();
            Logger.info('Vehicle form component initialized');

        } catch (error) {
            this.errorHandler.handleError(error, {
                action: 'initializeModules'
            });
            Logger.error('Error initializing modules', { error: error.message });
        }
    }

    /**
     * Initialize vehicle form component
     */
    async initializeVehicleForm() {
        try {
            // Dynamic import of vehicle form component
            const { createVehicleForm } = await import('./components/vehicleForm.js');

            // Create and initialize the vehicle form
            const vehicleForm = createVehicleForm('vehicle-form-container');

            if (vehicleForm && vehicleForm.isInitialized) {
                // Store in application state
                AppState.modules.set('vehicleForm', vehicleForm);

                // Setup callbacks for form events
                vehicleForm.onSubmit((vehicleData) => {
                    Logger.info('Vehicle form submitted successfully', { vehicleData });
                    // Refresh vehicle list or perform other actions
                    this.handleVehicleSubmit(vehicleData);
                });

                vehicleForm.onCancel(() => {
                    Logger.info('Vehicle form cancelled');
                });

                Logger.debug('Vehicle form component ready');
            } else {
                Logger.warn('Vehicle form failed to initialize');
            }
        } catch (error) {
            this.errorHandler.handleError(error, {
                action: 'initializeVehicleForm'
            });
            throw error;
        }
    }

    /**
     * Handle vehicle form submission
     * @param {Object} vehicleData - Submitted vehicle data
     */
    handleVehicleSubmit(vehicleData) {
        try {
            Logger.info('Processing vehicle submission', { vehicleData });

            // Dispatch custom event for other components to react
            const event = new CustomEvent('vehicle:added', {
                detail: { vehicle: vehicleData }
            });
            window.dispatchEvent(event);

            // Future: Refresh vehicle list display
            // this.refreshVehiclesList();

        } catch (error) {
            this.errorHandler.handleError(error, {
                action: 'handleVehicleSubmit',
                vehicleData
            });
        }
    }

    /**
     * Load a module dynamically
     */
    async loadModule(moduleName) {
        try {
            Logger.debug(`Loading module: ${moduleName}`);

            // Dynamic import will be used here when modules are available
            // const module = await import(`./services/${moduleName}.js`);
            // AppState.modules.set(moduleName, module);

            Logger.debug(`Module loaded: ${moduleName}`);
        } catch (error) {
            this.errorHandler.handleError(error, {
                action: 'loadModule',
                moduleName
            });
            throw error;
        }
    }

    /**
     * Dispatch application ready event
     */
    dispatchAppReady() {
        const event = new CustomEvent('app:ready', {
            detail: {
                timestamp: new Date().toISOString(),
                modules: Array.from(AppState.modules.keys())
            }
        });

        window.dispatchEvent(event);
        Logger.info('Application ready event dispatched');
    }

    /**
     * Get application state
     */
    getState() {
        return {
            ...AppState,
            modules: Array.from(AppState.modules.keys())
        };
    }
}

/**
 * Create and initialize the application
 */
const app = new Application();

/**
 * Start the application when the script loads
 */
(async () => {
    try {
        await app.init();
    } catch (error) {
        Logger.error('Failed to initialize application', {
            error: error.message,
            stack: error.stack
        });
    }
})();

/**
 * Export the application instance for testing and debugging
 */
export { app, AppState, Logger, ErrorHandler };
