/**
 * Storage Service
 *
 * Wrapper service for localStorage operations with error handling,
 * availability checks, JSON serialization/deserialization, and data versioning.
 */

/**
 * Storage service class for managing localStorage operations
 */
class StorageService {
    constructor() {
        this.storageAvailable = this.checkStorageAvailability();
        this.version = '1.0.0';
        this.versionKey = 'autocare_storage_version';
        this.initializeStorage();
    }

    /**
     * Check if localStorage is available
     * @returns {boolean} True if localStorage is available
     */
    checkStorageAvailability() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            console.error('localStorage is not available:', error.message);
            return false;
        }
    }

    /**
     * Initialize storage with version information
     */
    initializeStorage() {
        if (!this.storageAvailable) {
            console.warn('Storage not available, skipping initialization');
            return;
        }

        try {
            const storedVersion = localStorage.getItem(this.versionKey);

            if (!storedVersion) {
                // First time initialization
                localStorage.setItem(this.versionKey, this.version);
                console.log(`Storage initialized with version ${this.version}`);
            } else if (storedVersion !== this.version) {
                // Version mismatch - migration needed
                console.log(`Storage version mismatch. Stored: ${storedVersion}, Current: ${this.version}`);
                this.migrateStorage(storedVersion, this.version);
            }
        } catch (error) {
            console.error('Error initializing storage:', error.message);
        }
    }

    /**
     * Migrate storage data between versions
     * @param {string} fromVersion - Current stored version
     * @param {string} toVersion - Target version
     */
    migrateStorage(fromVersion, toVersion) {
        try {
            console.log(`Migrating storage from ${fromVersion} to ${toVersion}`);

            // Future migration logic will be added here as versions evolve
            // For now, just update the version

            localStorage.setItem(this.versionKey, toVersion);
            console.log('Storage migration completed successfully');
        } catch (error) {
            console.error('Error during storage migration:', error.message);
            throw new Error(`Storage migration failed: ${error.message}`);
        }
    }

    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Retrieved data or default value
     */
    get(key, defaultValue = null) {
        if (!this.storageAvailable) {
            console.warn('Storage not available, returning default value');
            return defaultValue;
        }

        if (!key || typeof key !== 'string') {
            console.error('Invalid key provided to get()');
            return defaultValue;
        }

        try {
            const item = localStorage.getItem(key);

            if (item === null) {
                return defaultValue;
            }

            // Try to parse as JSON
            try {
                return JSON.parse(item);
            } catch (parseError) {
                // If parsing fails, return the raw string
                console.warn(`Failed to parse JSON for key "${key}", returning raw value`);
                return item;
            }
        } catch (error) {
            console.error(`Error getting item with key "${key}":`, error.message);
            return defaultValue;
        }
    }

    /**
     * Set data in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} True if successful
     */
    set(key, value) {
        if (!this.storageAvailable) {
            console.warn('Storage not available, unable to set value');
            return false;
        }

        if (!key || typeof key !== 'string') {
            console.error('Invalid key provided to set()');
            return false;
        }

        try {
            // Serialize value to JSON
            const serialized = JSON.stringify(value);

            // Check if we're about to exceed quota
            try {
                localStorage.setItem(key, serialized);
                return true;
            } catch (quotaError) {
                if (quotaError.name === 'QuotaExceededError' ||
                    quotaError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    console.error('Storage quota exceeded');

                    // Attempt to free up space by removing old data
                    this.handleQuotaExceeded(key, serialized);
                    return false;
                } else {
                    throw quotaError;
                }
            }
        } catch (error) {
            console.error(`Error setting item with key "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Handle quota exceeded error
     * @param {string} key - Key that failed to be set
     * @param {string} value - Value that failed to be set
     */
    handleQuotaExceeded(key, value) {
        console.warn('Attempting to free up storage space');

        try {
            // Get all keys
            const allKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const storageKey = localStorage.key(i);
                if (storageKey && storageKey !== this.versionKey && storageKey !== key) {
                    allKeys.push(storageKey);
                }
            }

            // Remove oldest entries (simple strategy - can be improved)
            if (allKeys.length > 0) {
                const keyToRemove = allKeys[0];
                console.log(`Removing oldest key: ${keyToRemove}`);
                localStorage.removeItem(keyToRemove);

                // Try setting again
                try {
                    localStorage.setItem(key, value);
                    console.log('Successfully set value after freeing space');
                } catch (retryError) {
                    console.error('Failed to set value even after freeing space');
                }
            }
        } catch (error) {
            console.error('Error handling quota exceeded:', error.message);
        }
    }

    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} True if successful
     */
    remove(key) {
        if (!this.storageAvailable) {
            console.warn('Storage not available, unable to remove value');
            return false;
        }

        if (!key || typeof key !== 'string') {
            console.error('Invalid key provided to remove()');
            return false;
        }

        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing item with key "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Clear all data from localStorage (except version)
     * @param {boolean} includeVersion - Whether to also clear version info
     * @returns {boolean} True if successful
     */
    clear(includeVersion = false) {
        if (!this.storageAvailable) {
            console.warn('Storage not available, unable to clear');
            return false;
        }

        try {
            if (includeVersion) {
                localStorage.clear();
                console.log('All storage cleared including version');
            } else {
                // Save version before clearing
                const version = localStorage.getItem(this.versionKey);
                localStorage.clear();

                // Restore version
                if (version) {
                    localStorage.setItem(this.versionKey, version);
                }
                console.log('Storage cleared (version preserved)');
            }
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error.message);
            return false;
        }
    }

    /**
     * Check if a key exists in storage
     * @param {string} key - Storage key
     * @returns {boolean} True if key exists
     */
    has(key) {
        if (!this.storageAvailable) {
            return false;
        }

        if (!key || typeof key !== 'string') {
            return false;
        }

        try {
            return localStorage.getItem(key) !== null;
        } catch (error) {
            console.error(`Error checking key "${key}":`, error.message);
            return false;
        }
    }

    /**
     * Get all keys in storage
     * @param {boolean} includeVersion - Whether to include version key
     * @returns {string[]} Array of keys
     */
    getAllKeys(includeVersion = false) {
        if (!this.storageAvailable) {
            return [];
        }

        try {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (includeVersion || key !== this.versionKey)) {
                    keys.push(key);
                }
            }
            return keys;
        } catch (error) {
            console.error('Error getting all keys:', error.message);
            return [];
        }
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        if (!this.storageAvailable) {
            return {
                available: false,
                keyCount: 0,
                estimatedSize: 0
            };
        }

        try {
            const keys = this.getAllKeys(true);
            let estimatedSize = 0;

            keys.forEach(key => {
                const value = localStorage.getItem(key);
                if (value) {
                    // Rough estimate: each character is 2 bytes in UTF-16
                    estimatedSize += (key.length + value.length) * 2;
                }
            });

            return {
                available: true,
                keyCount: keys.length,
                estimatedSize: estimatedSize,
                estimatedSizeKB: (estimatedSize / 1024).toFixed(2),
                version: localStorage.getItem(this.versionKey) || 'unknown'
            };
        } catch (error) {
            console.error('Error getting storage info:', error.message);
            return {
                available: true,
                keyCount: 0,
                estimatedSize: 0,
                error: error.message
            };
        }
    }

    /**
     * Export all storage data
     * @returns {Object} All storage data
     */
    exportAll() {
        if (!this.storageAvailable) {
            return {};
        }

        try {
            const data = {};
            const keys = this.getAllKeys(true);

            keys.forEach(key => {
                data[key] = this.get(key);
            });

            return data;
        } catch (error) {
            console.error('Error exporting storage data:', error.message);
            return {};
        }
    }

    /**
     * Import storage data
     * @param {Object} data - Data to import
     * @param {boolean} clearFirst - Whether to clear existing data first
     * @returns {boolean} True if successful
     */
    importAll(data, clearFirst = false) {
        if (!this.storageAvailable) {
            console.warn('Storage not available, unable to import');
            return false;
        }

        if (!data || typeof data !== 'object') {
            console.error('Invalid data provided to importAll()');
            return false;
        }

        try {
            if (clearFirst) {
                this.clear(false);
            }

            let successCount = 0;
            let failCount = 0;

            Object.keys(data).forEach(key => {
                if (this.set(key, data[key])) {
                    successCount++;
                } else {
                    failCount++;
                }
            });

            console.log(`Import completed: ${successCount} successful, ${failCount} failed`);
            return failCount === 0;
        } catch (error) {
            console.error('Error importing storage data:', error.message);
            return false;
        }
    }

    /**
     * Check if storage is available
     * @returns {boolean} True if available
     */
    isAvailable() {
        return this.storageAvailable;
    }

    /**
     * Get current storage version
     * @returns {string} Version string
     */
    getVersion() {
        return this.version;
    }
}

// Create and export a singleton instance
const storageService = new StorageService();

export { storageService, StorageService };
