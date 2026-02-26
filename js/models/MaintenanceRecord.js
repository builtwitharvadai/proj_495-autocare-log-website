/**
 * MaintenanceRecord Model
 *
 * ES6 class representing a maintenance record with validation for all fields.
 * Provides date formatting utilities and serialization/deserialization methods.
 */

class MaintenanceRecord {
    /**
     * Create a new MaintenanceRecord instance
     * @param {Object} data - Maintenance record data
     * @param {string} data.id - Unique identifier
     * @param {string} data.vehicleId - Associated vehicle ID
     * @param {string} data.date - Service date (ISO 8601 format)
     * @param {string} data.serviceType - Type of service performed
     * @param {string} data.description - Description of the service
     * @param {number} data.cost - Cost of the service
     */
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.vehicleId = data.vehicleId || '';
        this.date = data.date || new Date().toISOString();
        this.serviceType = data.serviceType || '';
        this.description = data.description || '';
        this.cost = data.cost || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Generate a unique ID for the maintenance record
     * @returns {string} Unique identifier
     */
    generateId() {
        return `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate the record ID
     * @returns {Object} Validation result
     */
    validateId() {
        if (!this.id || typeof this.id !== 'string' || this.id.trim() === '') {
            return {
                valid: false,
                field: 'id',
                message: 'Maintenance record ID is required and must be a non-empty string'
            };
        }
        return { valid: true };
    }

    /**
     * Validate the vehicle ID
     * @returns {Object} Validation result
     */
    validateVehicleId() {
        if (!this.vehicleId || typeof this.vehicleId !== 'string') {
            return {
                valid: false,
                field: 'vehicleId',
                message: 'Vehicle ID is required and must be a string'
            };
        }

        const trimmedVehicleId = this.vehicleId.trim();
        if (trimmedVehicleId.length === 0) {
            return {
                valid: false,
                field: 'vehicleId',
                message: 'Vehicle ID cannot be empty'
            };
        }

        return { valid: true };
    }

    /**
     * Validate the service date
     * @returns {Object} Validation result
     */
    validateDate() {
        if (!this.date || typeof this.date !== 'string') {
            return {
                valid: false,
                field: 'date',
                message: 'Service date is required and must be a string'
            };
        }

        const dateObj = new Date(this.date);
        if (isNaN(dateObj.getTime())) {
            return {
                valid: false,
                field: 'date',
                message: 'Service date must be a valid date'
            };
        }

        // Check if date is not in the future (with 1 day buffer for timezone differences)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        if (dateObj > tomorrow) {
            return {
                valid: false,
                field: 'date',
                message: 'Service date cannot be in the future'
            };
        }

        // Check if date is not too far in the past (100 years)
        const minDate = new Date();
        minDate.setFullYear(minDate.getFullYear() - 100);

        if (dateObj < minDate) {
            return {
                valid: false,
                field: 'date',
                message: 'Service date is too far in the past'
            };
        }

        return { valid: true };
    }

    /**
     * Validate the service type
     * @returns {Object} Validation result
     */
    validateServiceType() {
        if (!this.serviceType || typeof this.serviceType !== 'string') {
            return {
                valid: false,
                field: 'serviceType',
                message: 'Service type is required and must be a string'
            };
        }

        const trimmedServiceType = this.serviceType.trim();
        if (trimmedServiceType.length === 0) {
            return {
                valid: false,
                field: 'serviceType',
                message: 'Service type cannot be empty'
            };
        }

        if (trimmedServiceType.length > 100) {
            return {
                valid: false,
                field: 'serviceType',
                message: 'Service type must be 100 characters or less'
            };
        }

        return { valid: true };
    }

    /**
     * Validate the description
     * @returns {Object} Validation result
     */
    validateDescription() {
        if (this.description === null || this.description === undefined) {
            return {
                valid: false,
                field: 'description',
                message: 'Description is required'
            };
        }

        if (typeof this.description !== 'string') {
            return {
                valid: false,
                field: 'description',
                message: 'Description must be a string'
            };
        }

        if (this.description.length > 5000) {
            return {
                valid: false,
                field: 'description',
                message: 'Description must be 5000 characters or less'
            };
        }

        return { valid: true };
    }

    /**
     * Validate the cost
     * @returns {Object} Validation result
     */
    validateCost() {
        if (this.cost === null || this.cost === undefined) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost is required'
            };
        }

        const costNum = Number(this.cost);
        if (isNaN(costNum)) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost must be a valid number'
            };
        }

        if (costNum < 0) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost cannot be negative'
            };
        }

        if (costNum > 1000000) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost exceeds maximum allowed value'
            };
        }

        return { valid: true };
    }

    /**
     * Validate all maintenance record fields
     * @returns {Object} Validation result with array of errors
     */
    validate() {
        const errors = [];

        const idValidation = this.validateId();
        if (!idValidation.valid) {
            errors.push(idValidation);
        }

        const vehicleIdValidation = this.validateVehicleId();
        if (!vehicleIdValidation.valid) {
            errors.push(vehicleIdValidation);
        }

        const dateValidation = this.validateDate();
        if (!dateValidation.valid) {
            errors.push(dateValidation);
        }

        const serviceTypeValidation = this.validateServiceType();
        if (!serviceTypeValidation.valid) {
            errors.push(serviceTypeValidation);
        }

        const descriptionValidation = this.validateDescription();
        if (!descriptionValidation.valid) {
            errors.push(descriptionValidation);
        }

        const costValidation = this.validateCost();
        if (!costValidation.valid) {
            errors.push(costValidation);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Format date to display string (e.g., "Jan 15, 2024")
     * @returns {string} Formatted date
     */
    formatDateShort() {
        try {
            const dateObj = new Date(this.date);
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Date';
            }

            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return dateObj.toLocaleDateString('en-US', options);
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Format date to long display string (e.g., "January 15, 2024")
     * @returns {string} Formatted date
     */
    formatDateLong() {
        try {
            const dateObj = new Date(this.date);
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Date';
            }

            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return dateObj.toLocaleDateString('en-US', options);
        } catch (error) {
            return 'Invalid Date';
        }
    }

    /**
     * Format date to ISO date string (YYYY-MM-DD)
     * @returns {string} Formatted date
     */
    formatDateISO() {
        try {
            const dateObj = new Date(this.date);
            if (isNaN(dateObj.getTime())) {
                return '';
            }

            return dateObj.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    }

    /**
     * Get relative time string (e.g., "2 days ago")
     * @returns {string} Relative time string
     */
    getRelativeTime() {
        try {
            const dateObj = new Date(this.date);
            if (isNaN(dateObj.getTime())) {
                return 'Invalid Date';
            }

            const now = new Date();
            const diffMs = now - dateObj;
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const diffMonths = Math.floor(diffDays / 30);
            const diffYears = Math.floor(diffDays / 365);

            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else if (diffDays < 30) {
                const weeks = Math.floor(diffDays / 7);
                return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
            } else if (diffMonths < 12) {
                return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
            } else {
                return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
            }
        } catch (error) {
            return 'Unknown';
        }
    }

    /**
     * Serialize the maintenance record to a plain object for storage
     * @returns {Object} Serialized maintenance record data
     */
    toJSON() {
        return {
            id: this.id,
            vehicleId: this.vehicleId,
            date: this.date,
            serviceType: this.serviceType,
            description: this.description,
            cost: this.cost,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Deserialize a plain object into a MaintenanceRecord instance
     * @param {Object} data - Plain object data
     * @returns {MaintenanceRecord} MaintenanceRecord instance
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided for MaintenanceRecord deserialization');
        }

        return new MaintenanceRecord({
            id: data.id,
            vehicleId: data.vehicleId,
            date: data.date,
            serviceType: data.serviceType,
            description: data.description,
            cost: data.cost,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }

    /**
     * Update maintenance record properties with validation
     * @param {Object} updates - Properties to update
     * @returns {Object} Update result
     */
    update(updates) {
        if (!updates || typeof updates !== 'object') {
            return {
                success: false,
                message: 'Invalid updates provided'
            };
        }

        // Store original values for rollback
        const originalValues = {
            vehicleId: this.vehicleId,
            date: this.date,
            serviceType: this.serviceType,
            description: this.description,
            cost: this.cost
        };

        try {
            // Apply updates
            if (updates.vehicleId !== undefined) {
                this.vehicleId = updates.vehicleId;
            }
            if (updates.date !== undefined) {
                this.date = updates.date;
            }
            if (updates.serviceType !== undefined) {
                this.serviceType = updates.serviceType;
            }
            if (updates.description !== undefined) {
                this.description = updates.description;
            }
            if (updates.cost !== undefined) {
                this.cost = updates.cost;
            }

            // Validate updated record
            const validation = this.validate();
            if (!validation.valid) {
                // Rollback changes
                this.vehicleId = originalValues.vehicleId;
                this.date = originalValues.date;
                this.serviceType = originalValues.serviceType;
                this.description = originalValues.description;
                this.cost = originalValues.cost;

                return {
                    success: false,
                    message: 'Validation failed',
                    errors: validation.errors
                };
            }

            // Update timestamp
            this.updatedAt = new Date().toISOString();

            return {
                success: true,
                message: 'Maintenance record updated successfully'
            };
        } catch (error) {
            // Rollback on error
            this.vehicleId = originalValues.vehicleId;
            this.date = originalValues.date;
            this.serviceType = originalValues.serviceType;
            this.description = originalValues.description;
            this.cost = originalValues.cost;

            return {
                success: false,
                message: 'Error updating maintenance record',
                error: error.message
            };
        }
    }

    /**
     * Get a display string for the maintenance record
     * @returns {string} Display string
     */
    toString() {
        return `${this.serviceType} on ${this.formatDateShort()} - $${this.cost.toFixed(2)}`;
    }
}

// Export the MaintenanceRecord class
export { MaintenanceRecord };
