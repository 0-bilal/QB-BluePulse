/**
 * QB-BluePulse - Pool Management System
 * Storage Manager
 * Version: 3.0
 * 
 * This file handles all local storage operations
 * for the application including saving and loading data
 */

const StorageManager = {
    // Storage keys
    KEYS: {
        COMPLETED_TASKS: 'qbBluePulse_completedTasks',
        POOL_VOLUME: 'qbBluePulse_poolVolume',
        CURRENT_WEEK: 'qbBluePulse_currentWeek',
        APP_VERSION: 'qbBluePulse_version'
    },

    // App version for migration purposes
    APP_VERSION: '3.0',

    /**
     * Initialize storage
     * Check version and migrate data if needed
     */
    init() {
        const storedVersion = this.get(this.KEYS.APP_VERSION);
        
        if (!storedVersion || storedVersion !== this.APP_VERSION) {
            console.log('Initializing storage for version', this.APP_VERSION);
            this.set(this.KEYS.APP_VERSION, this.APP_VERSION);
        }
    },

    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {*} defaultValue - Default value if key doesn't exist
     * @returns {*} Retrieved value or default
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item !== null ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from storage:', error);
            return defaultValue;
        }
    },

    /**
     * Set item in localStorage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error writing to storage:', error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from storage:', error);
            return false;
        }
    },

    /**
     * Clear all app data from localStorage
     * @returns {boolean} Success status
     */
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    },

    /**
     * Get completed tasks
     * @returns {Set} Set of completed task IDs
     */
    getCompletedTasks() {
        const tasks = this.get(this.KEYS.COMPLETED_TASKS, []);
        return new Set(tasks);
    },

    /**
     * Save completed tasks
     * @param {Set} completedTasks - Set of completed task IDs
     * @returns {boolean} Success status
     */
    saveCompletedTasks(completedTasks) {
        const tasksArray = Array.from(completedTasks);
        return this.set(this.KEYS.COMPLETED_TASKS, tasksArray);
    },

    /**
     * Get pool volume
     * @returns {number} Pool volume in tons
     */
    getPoolVolume() {
        return this.get(this.KEYS.POOL_VOLUME, 29);
    },

    /**
     * Save pool volume
     * @param {number} volume - Pool volume in tons
     * @returns {boolean} Success status
     */
    savePoolVolume(volume) {
        return this.set(this.KEYS.POOL_VOLUME, volume);
    },

    /**
     * Get current week selection
     * @returns {string} Current week ('all', '1', '2', '3', '4')
     */
    getCurrentWeek() {
        return this.get(this.KEYS.CURRENT_WEEK, 'all');
    },

    /**
     * Save current week selection
     * @param {string} week - Week selection
     * @returns {boolean} Success status
     */
    saveCurrentWeek(week) {
        return this.set(this.KEYS.CURRENT_WEEK, week);
    },

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        const data = {
            version: this.APP_VERSION,
            completedTasks: Array.from(this.getCompletedTasks()),
            poolVolume: this.getPoolVolume(),
            currentWeek: this.getCurrentWeek(),
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * Import data from JSON
     * @param {string} jsonString - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate data structure
            if (!data.version || !Array.isArray(data.completedTasks)) {
                throw new Error('Invalid data format');
            }

            // Import data
            this.saveCompletedTasks(new Set(data.completedTasks));
            this.savePoolVolume(data.poolVolume || 29);
            this.saveCurrentWeek(data.currentWeek || 'all');
            
            console.log('Data imported successfully');
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    },

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        const stats = {
            completedTasks: this.getCompletedTasks().size,
            poolVolume: this.getPoolVolume(),
            version: this.APP_VERSION
        };

        // Calculate approximate storage size
        let totalSize = 0;
        Object.values(this.KEYS).forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += item.length;
            }
        });

        stats.storageSize = (totalSize / 1024).toFixed(2) + ' KB';
        
        return stats;
    }
};

// Initialize storage when script loads
StorageManager.init();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
