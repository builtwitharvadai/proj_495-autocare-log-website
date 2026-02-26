/**
 * Data Manager Service
 *
 * Main data management service providing CRUD operations for vehicles and maintenance records.
 * Uses storageService for persistence with proper error handling.
 */

import { storageService } from './storageService.js';

/**
 * Storage keys for different data types
 */
const STORAGE_KEYS = {
    VEHICLES: 'autocare_vehicles',
    MAINTENANCE_RECORDS: 'autocare_maintenance_records',
    LAST_BACKUP: 'autocare_last_backup'
};

/**
 * Data Manager class for managing application data
 */
class DataManager {
    constructor() {
        this.vehiclesCache = null;
        this.maintenanceRecordsCache = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.lastVehiclesCacheTime = 0;
        this.lastMaintenanceCacheTime = 0;
    }

    /**
     * Initialize the data manager
     * @returns {boolean} True if successful
     */
    initialize() {
        try {
            if (!storageService.isAvailable()) {
                console.error('Storage service is not available');
                return false;
            }

            // Initialize storage with empty arrays if not present
            if (!storageService.has(STORAGE_KEYS.VEHICLES)) {
                storageService.set(STORAGE_KEYS.VEHICLES, []);
            }

            if (!storageService.has(STORAGE_KEYS.MAINTENANCE_RECORDS)) {
                storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, []);
            }

            console.log('DataManager initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing DataManager:', error.message);
            return false;
        }
    }

    // ==================== Vehicle Operations ====================

    /**
     * Get all vehicles
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Array} Array of vehicles
     */
    getAllVehicles(useCache = true) {
        try {
            const now = Date.now();

            // Use cache if valid
            if (useCache && this.vehiclesCache &&
                (now - this.lastVehiclesCacheTime) < this.cacheExpiry) {
                return [...this.vehiclesCache];
            }

            const vehicles = storageService.get(STORAGE_KEYS.VEHICLES, []);

            // Update cache
            this.vehiclesCache = vehicles;
            this.lastVehiclesCacheTime = now;

            return Array.isArray(vehicles) ? [...vehicles] : [];
        } catch (error) {
            console.error('Error getting all vehicles:', error.message);
            return [];
        }
    }

    /**
     * Get vehicle by ID
     * @param {string} id - Vehicle ID
     * @returns {Object|null} Vehicle object or null
     */
    getVehicleById(id) {
        if (!id || typeof id !== 'string') {
            console.error('Invalid vehicle ID provided');
            return null;
        }

        try {
            const vehicles = this.getAllVehicles();
            return vehicles.find(vehicle => vehicle.id === id) || null;
        } catch (error) {
            console.error(`Error getting vehicle with ID ${id}:`, error.message);
            return null;
        }
    }

    /**
     * Add a new vehicle
     * @param {Object} vehicleData - Vehicle data
     * @returns {Object} Result object with success status and data
     */
    addVehicle(vehicleData) {
        if (!vehicleData || typeof vehicleData !== 'object') {
            return {
                success: false,
                message: 'Invalid vehicle data provided'
            };
        }

        try {
            const vehicles = this.getAllVehicles(false);

            // Check for duplicate ID
            if (vehicleData.id && vehicles.some(v => v.id === vehicleData.id)) {
                return {
                    success: false,
                    message: `Vehicle with ID ${vehicleData.id} already exists`
                };
            }

            // Generate ID if not provided
            if (!vehicleData.id) {
                vehicleData.id = this.generateVehicleId();
            }

            // Add timestamps
            const now = new Date().toISOString();
            vehicleData.createdAt = vehicleData.createdAt || now;
            vehicleData.updatedAt = now;

            // Add vehicle
            vehicles.push(vehicleData);

            // Save to storage
            if (storageService.set(STORAGE_KEYS.VEHICLES, vehicles)) {
                this.invalidateVehiclesCache();
                console.log(`Vehicle added successfully: ${vehicleData.id}`);
                return {
                    success: true,
                    message: 'Vehicle added successfully',
                    data: vehicleData
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save vehicle to storage'
                };
            }
        } catch (error) {
            console.error('Error adding vehicle:', error.message);
            return {
                success: false,
                message: `Error adding vehicle: ${error.message}`
            };
        }
    }

    /**
     * Update an existing vehicle
     * @param {string} id - Vehicle ID
     * @param {Object} updates - Fields to update
     * @returns {Object} Result object
     */
    updateVehicle(id, updates) {
        if (!id || typeof id !== 'string') {
            return {
                success: false,
                message: 'Invalid vehicle ID provided'
            };
        }

        if (!updates || typeof updates !== 'object') {
            return {
                success: false,
                message: 'Invalid updates provided'
            };
        }

        try {
            const vehicles = this.getAllVehicles(false);
            const index = vehicles.findIndex(v => v.id === id);

            if (index === -1) {
                return {
                    success: false,
                    message: `Vehicle with ID ${id} not found`
                };
            }

            // Update vehicle (preserve id and createdAt)
            const updatedVehicle = {
                ...vehicles[index],
                ...updates,
                id: vehicles[index].id,
                createdAt: vehicles[index].createdAt,
                updatedAt: new Date().toISOString()
            };

            vehicles[index] = updatedVehicle;

            // Save to storage
            if (storageService.set(STORAGE_KEYS.VEHICLES, vehicles)) {
                this.invalidateVehiclesCache();
                console.log(`Vehicle updated successfully: ${id}`);
                return {
                    success: true,
                    message: 'Vehicle updated successfully',
                    data: updatedVehicle
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save updated vehicle to storage'
                };
            }
        } catch (error) {
            console.error(`Error updating vehicle ${id}:`, error.message);
            return {
                success: false,
                message: `Error updating vehicle: ${error.message}`
            };
        }
    }

    /**
     * Delete a vehicle
     * @param {string} id - Vehicle ID
     * @returns {Object} Result object
     */
    deleteVehicle(id) {
        if (!id || typeof id !== 'string') {
            return {
                success: false,
                message: 'Invalid vehicle ID provided'
            };
        }

        try {
            const vehicles = this.getAllVehicles(false);
            const index = vehicles.findIndex(v => v.id === id);

            if (index === -1) {
                return {
                    success: false,
                    message: `Vehicle with ID ${id} not found`
                };
            }

            // Remove vehicle
            const deletedVehicle = vehicles.splice(index, 1)[0];

            // Save to storage
            if (storageService.set(STORAGE_KEYS.VEHICLES, vehicles)) {
                this.invalidateVehiclesCache();

                // Also delete associated maintenance records
                this.deleteMaintenanceRecordsByVehicleId(id);

                console.log(`Vehicle deleted successfully: ${id}`);
                return {
                    success: true,
                    message: 'Vehicle deleted successfully',
                    data: deletedVehicle
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save changes to storage'
                };
            }
        } catch (error) {
            console.error(`Error deleting vehicle ${id}:`, error.message);
            return {
                success: false,
                message: `Error deleting vehicle: ${error.message}`
            };
        }
    }

    // ==================== Maintenance Record Operations ====================

    /**
     * Get all maintenance records
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Array} Array of maintenance records
     */
    getAllMaintenanceRecords(useCache = true) {
        try {
            const now = Date.now();

            // Use cache if valid
            if (useCache && this.maintenanceRecordsCache &&
                (now - this.lastMaintenanceCacheTime) < this.cacheExpiry) {
                return [...this.maintenanceRecordsCache];
            }

            const records = storageService.get(STORAGE_KEYS.MAINTENANCE_RECORDS, []);

            // Update cache
            this.maintenanceRecordsCache = records;
            this.lastMaintenanceCacheTime = now;

            return Array.isArray(records) ? [...records] : [];
        } catch (error) {
            console.error('Error getting all maintenance records:', error.message);
            return [];
        }
    }

    /**
     * Get maintenance record by ID
     * @param {string} id - Maintenance record ID
     * @returns {Object|null} Maintenance record or null
     */
    getMaintenanceRecordById(id) {
        if (!id || typeof id !== 'string') {
            console.error('Invalid maintenance record ID provided');
            return null;
        }

        try {
            const records = this.getAllMaintenanceRecords();
            return records.find(record => record.id === id) || null;
        } catch (error) {
            console.error(`Error getting maintenance record with ID ${id}:`, error.message);
            return null;
        }
    }

    /**
     * Get maintenance records by vehicle ID
     * @param {string} vehicleId - Vehicle ID
     * @returns {Array} Array of maintenance records
     */
    getMaintenanceRecordsByVehicleId(vehicleId) {
        if (!vehicleId || typeof vehicleId !== 'string') {
            console.error('Invalid vehicle ID provided');
            return [];
        }

        try {
            const records = this.getAllMaintenanceRecords();
            return records.filter(record => record.vehicleId === vehicleId);
        } catch (error) {
            console.error(`Error getting maintenance records for vehicle ${vehicleId}:`, error.message);
            return [];
        }
    }

    /**
     * Add a new maintenance record
     * @param {Object} recordData - Maintenance record data
     * @returns {Object} Result object
     */
    addMaintenanceRecord(recordData) {
        if (!recordData || typeof recordData !== 'object') {
            return {
                success: false,
                message: 'Invalid maintenance record data provided'
            };
        }

        try {
            const records = this.getAllMaintenanceRecords(false);

            // Check for duplicate ID
            if (recordData.id && records.some(r => r.id === recordData.id)) {
                return {
                    success: false,
                    message: `Maintenance record with ID ${recordData.id} already exists`
                };
            }

            // Validate vehicle exists
            if (recordData.vehicleId) {
                const vehicle = this.getVehicleById(recordData.vehicleId);
                if (!vehicle) {
                    return {
                        success: false,
                        message: `Vehicle with ID ${recordData.vehicleId} not found`
                    };
                }
            }

            // Generate ID if not provided
            if (!recordData.id) {
                recordData.id = this.generateMaintenanceRecordId();
            }

            // Add timestamps
            const now = new Date().toISOString();
            recordData.createdAt = recordData.createdAt || now;
            recordData.updatedAt = now;

            // Add record
            records.push(recordData);

            // Save to storage
            if (storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, records)) {
                this.invalidateMaintenanceCache();
                console.log(`Maintenance record added successfully: ${recordData.id}`);
                return {
                    success: true,
                    message: 'Maintenance record added successfully',
                    data: recordData
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save maintenance record to storage'
                };
            }
        } catch (error) {
            console.error('Error adding maintenance record:', error.message);
            return {
                success: false,
                message: `Error adding maintenance record: ${error.message}`
            };
        }
    }

    /**
     * Update an existing maintenance record
     * @param {string} id - Maintenance record ID
     * @param {Object} updates - Fields to update
     * @returns {Object} Result object
     */
    updateMaintenanceRecord(id, updates) {
        if (!id || typeof id !== 'string') {
            return {
                success: false,
                message: 'Invalid maintenance record ID provided'
            };
        }

        if (!updates || typeof updates !== 'object') {
            return {
                success: false,
                message: 'Invalid updates provided'
            };
        }

        try {
            const records = this.getAllMaintenanceRecords(false);
            const index = records.findIndex(r => r.id === id);

            if (index === -1) {
                return {
                    success: false,
                    message: `Maintenance record with ID ${id} not found`
                };
            }

            // Update record (preserve id and createdAt)
            const updatedRecord = {
                ...records[index],
                ...updates,
                id: records[index].id,
                createdAt: records[index].createdAt,
                updatedAt: new Date().toISOString()
            };

            records[index] = updatedRecord;

            // Save to storage
            if (storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, records)) {
                this.invalidateMaintenanceCache();
                console.log(`Maintenance record updated successfully: ${id}`);
                return {
                    success: true,
                    message: 'Maintenance record updated successfully',
                    data: updatedRecord
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save updated maintenance record to storage'
                };
            }
        } catch (error) {
            console.error(`Error updating maintenance record ${id}:`, error.message);
            return {
                success: false,
                message: `Error updating maintenance record: ${error.message}`
            };
        }
    }

    /**
     * Delete a maintenance record
     * @param {string} id - Maintenance record ID
     * @returns {Object} Result object
     */
    deleteMaintenanceRecord(id) {
        if (!id || typeof id !== 'string') {
            return {
                success: false,
                message: 'Invalid maintenance record ID provided'
            };
        }

        try {
            const records = this.getAllMaintenanceRecords(false);
            const index = records.findIndex(r => r.id === id);

            if (index === -1) {
                return {
                    success: false,
                    message: `Maintenance record with ID ${id} not found`
                };
            }

            // Remove record
            const deletedRecord = records.splice(index, 1)[0];

            // Save to storage
            if (storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, records)) {
                this.invalidateMaintenanceCache();
                console.log(`Maintenance record deleted successfully: ${id}`);
                return {
                    success: true,
                    message: 'Maintenance record deleted successfully',
                    data: deletedRecord
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save changes to storage'
                };
            }
        } catch (error) {
            console.error(`Error deleting maintenance record ${id}:`, error.message);
            return {
                success: false,
                message: `Error deleting maintenance record: ${error.message}`
            };
        }
    }

    /**
     * Delete all maintenance records for a vehicle
     * @param {string} vehicleId - Vehicle ID
     * @returns {Object} Result object
     */
    deleteMaintenanceRecordsByVehicleId(vehicleId) {
        if (!vehicleId || typeof vehicleId !== 'string') {
            return {
                success: false,
                message: 'Invalid vehicle ID provided'
            };
        }

        try {
            const records = this.getAllMaintenanceRecords(false);
            const filteredRecords = records.filter(r => r.vehicleId !== vehicleId);
            const deletedCount = records.length - filteredRecords.length;

            // Save to storage
            if (storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, filteredRecords)) {
                this.invalidateMaintenanceCache();
                console.log(`Deleted ${deletedCount} maintenance records for vehicle ${vehicleId}`);
                return {
                    success: true,
                    message: `Deleted ${deletedCount} maintenance records`,
                    count: deletedCount
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to save changes to storage'
                };
            }
        } catch (error) {
            console.error(`Error deleting maintenance records for vehicle ${vehicleId}:`, error.message);
            return {
                success: false,
                message: `Error deleting maintenance records: ${error.message}`
            };
        }
    }

    // ==================== Query Operations ====================

    /**
     * Search vehicles by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching vehicles
     */
    searchVehicles(criteria) {
        if (!criteria || typeof criteria !== 'object') {
            return this.getAllVehicles();
        }

        try {
            const vehicles = this.getAllVehicles();

            return vehicles.filter(vehicle => {
                let matches = true;

                if (criteria.make && matches) {
                    matches = vehicle.make.toLowerCase().includes(criteria.make.toLowerCase());
                }

                if (criteria.model && matches) {
                    matches = vehicle.model.toLowerCase().includes(criteria.model.toLowerCase());
                }

                if (criteria.year && matches) {
                    matches = vehicle.year === criteria.year;
                }

                if (criteria.minMileage !== undefined && matches) {
                    matches = vehicle.mileage >= criteria.minMileage;
                }

                if (criteria.maxMileage !== undefined && matches) {
                    matches = vehicle.mileage <= criteria.maxMileage;
                }

                return matches;
            });
        } catch (error) {
            console.error('Error searching vehicles:', error.message);
            return [];
        }
    }

    /**
     * Search maintenance records by criteria
     * @param {Object} criteria - Search criteria
     * @returns {Array} Matching maintenance records
     */
    searchMaintenanceRecords(criteria) {
        if (!criteria || typeof criteria !== 'object') {
            return this.getAllMaintenanceRecords();
        }

        try {
            const records = this.getAllMaintenanceRecords();

            return records.filter(record => {
                let matches = true;

                if (criteria.vehicleId && matches) {
                    matches = record.vehicleId === criteria.vehicleId;
                }

                if (criteria.serviceType && matches) {
                    matches = record.serviceType.toLowerCase().includes(criteria.serviceType.toLowerCase());
                }

                if (criteria.startDate && matches) {
                    matches = new Date(record.date) >= new Date(criteria.startDate);
                }

                if (criteria.endDate && matches) {
                    matches = new Date(record.date) <= new Date(criteria.endDate);
                }

                if (criteria.minCost !== undefined && matches) {
                    matches = record.cost >= criteria.minCost;
                }

                if (criteria.maxCost !== undefined && matches) {
                    matches = record.cost <= criteria.maxCost;
                }

                return matches;
            });
        } catch (error) {
            console.error('Error searching maintenance records:', error.message);
            return [];
        }
    }

    // ==================== Utility Methods ====================

    /**
     * Generate unique vehicle ID
     * @returns {string} Unique ID
     */
    generateVehicleId() {
        return `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique maintenance record ID
     * @returns {string} Unique ID
     */
    generateMaintenanceRecordId() {
        return `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Invalidate vehicles cache
     */
    invalidateVehiclesCache() {
        this.vehiclesCache = null;
        this.lastVehiclesCacheTime = 0;
    }

    /**
     * Invalidate maintenance records cache
     */
    invalidateMaintenanceCache() {
        this.maintenanceRecordsCache = null;
        this.lastMaintenanceCacheTime = 0;
    }

    /**
     * Clear all caches
     */
    clearAllCaches() {
        this.invalidateVehiclesCache();
        this.invalidateMaintenanceCache();
    }

    /**
     * Export all data
     * @returns {Object} All data
     */
    exportAllData() {
        try {
            return {
                vehicles: this.getAllVehicles(false),
                maintenanceRecords: this.getAllMaintenanceRecords(false),
                exportDate: new Date().toISOString(),
                version: storageService.getVersion()
            };
        } catch (error) {
            console.error('Error exporting data:', error.message);
            return null;
        }
    }

    /**
     * Import all data
     * @param {Object} data - Data to import
     * @param {boolean} clearFirst - Whether to clear existing data
     * @returns {Object} Result object
     */
    importAllData(data, clearFirst = false) {
        if (!data || typeof data !== 'object') {
            return {
                success: false,
                message: 'Invalid data provided'
            };
        }

        try {
            if (clearFirst) {
                storageService.set(STORAGE_KEYS.VEHICLES, []);
                storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, []);
            }

            const results = {
                vehiclesImported: 0,
                maintenanceRecordsImported: 0,
                errors: []
            };

            // Import vehicles
            if (Array.isArray(data.vehicles)) {
                if (storageService.set(STORAGE_KEYS.VEHICLES, data.vehicles)) {
                    results.vehiclesImported = data.vehicles.length;
                } else {
                    results.errors.push('Failed to import vehicles');
                }
            }

            // Import maintenance records
            if (Array.isArray(data.maintenanceRecords)) {
                if (storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, data.maintenanceRecords)) {
                    results.maintenanceRecordsImported = data.maintenanceRecords.length;
                } else {
                    results.errors.push('Failed to import maintenance records');
                }
            }

            this.clearAllCaches();

            return {
                success: results.errors.length === 0,
                message: results.errors.length === 0 ? 'Data imported successfully' : 'Data import completed with errors',
                results
            };
        } catch (error) {
            console.error('Error importing data:', error.message);
            return {
                success: false,
                message: `Error importing data: ${error.message}`
            };
        }
    }

    /**
     * Clear all data
     * @returns {Object} Result object
     */
    clearAllData() {
        try {
            storageService.set(STORAGE_KEYS.VEHICLES, []);
            storageService.set(STORAGE_KEYS.MAINTENANCE_RECORDS, []);
            this.clearAllCaches();

            console.log('All data cleared successfully');
            return {
                success: true,
                message: 'All data cleared successfully'
            };
        } catch (error) {
            console.error('Error clearing all data:', error.message);
            return {
                success: false,
                message: `Error clearing data: ${error.message}`
            };
        }
    }
}

// Create and export a singleton instance
const dataManager = new DataManager();

// Initialize on creation
dataManager.initialize();

export { dataManager, DataManager, STORAGE_KEYS };
