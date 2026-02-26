/**
 * Vehicle Model
 *
 * ES6 class representing a vehicle with validation for all fields.
 * Provides serialization and deserialization methods for storage.
 */

class Vehicle {
    /**
     * Create a new Vehicle instance
     * @param {Object} data - Vehicle data
     * @param {string} data.id - Unique identifier
     * @param {string} data.make - Vehicle manufacturer
     * @param {string} data.model - Vehicle model
     * @param {number} data.year - Manufacturing year
     * @param {number} data.mileage - Current mileage
     */
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.make = data.make || '';
        this.model = data.model || '';
        this.year = data.year || null;
        this.mileage = data.mileage || 0;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
    }

    /**
     * Generate a unique ID for the vehicle
     * @returns {string} Unique identifier
     */
    generateId() {
        return `vehicle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate the vehicle ID
     * @returns {Object} Validation result
     */
    validateId() {
        if (!this.id || typeof this.id !== 'string' || this.id.trim() === '') {
            return {
                valid: false,
                field: 'id',
                message: 'Vehicle ID is required and must be a non-empty string'
            };
        }
        return { valid: true };
    }

    /**
     * Validate the vehicle make
     * @returns {Object} Validation result
     */
    validateMake() {
        if (!this.make || typeof this.make !== 'string') {
            return {
                valid: false,
                field: 'make',
                message: 'Vehicle make is required and must be a string'
            };
        }

        const trimmedMake = this.make.trim();
        if (trimmedMake.length === 0) {
            return {
                valid: false,
                field: 'make',
                message: 'Vehicle make cannot be empty'
            };
        }

        if (trimmedMake.length > 100) {
            return {
                valid: false,
                field: 'make',
                message: 'Vehicle make must be 100 characters or less'
            };
        }

        return { valid: true };
    }

    /**
     * Validate the vehicle model
     * @returns {Object} Validation result
     */
    validateModel() {
        if (!this.model || typeof this.model !== 'string') {
            return {
                valid: false,
                field: 'model',
                message: 'Vehicle model is required and must be a string'
            };
        }

        const trimmedModel = this.model.trim();
        if (trimmedModel.length === 0) {
            return {
                valid: false,
                field: 'model',
                message: 'Vehicle model cannot be empty'
            };
        }

        if (trimmedModel.length > 100) {
            return {
                valid: false,
                field: 'model',
                message: 'Vehicle model must be 100 characters or less'
            };
        }

        return { valid: true };
    }

    /**
     * Validate the vehicle year
     * @returns {Object} Validation result
     */
    validateYear() {
        if (this.year === null || this.year === undefined) {
            return {
                valid: false,
                field: 'year',
                message: 'Vehicle year is required'
            };
        }

        const yearNum = Number(this.year);
        if (!Number.isInteger(yearNum)) {
            return {
                valid: false,
                field: 'year',
                message: 'Vehicle year must be a valid integer'
            };
        }

        const currentYear = new Date().getFullYear();
        const minYear = 1886; // First automobile was invented in 1886

        if (yearNum < minYear || yearNum > currentYear + 1) {
            return {
                valid: false,
                field: 'year',
                message: `Vehicle year must be between ${minYear} and ${currentYear + 1}`
            };
        }

        return { valid: true };
    }

    /**
     * Validate the vehicle mileage
     * @returns {Object} Validation result
     */
    validateMileage() {
        if (this.mileage === null || this.mileage === undefined) {
            return {
                valid: false,
                field: 'mileage',
                message: 'Vehicle mileage is required'
            };
        }

        const mileageNum = Number(this.mileage);
        if (isNaN(mileageNum)) {
            return {
                valid: false,
                field: 'mileage',
                message: 'Vehicle mileage must be a valid number'
            };
        }

        if (mileageNum < 0) {
            return {
                valid: false,
                field: 'mileage',
                message: 'Vehicle mileage cannot be negative'
            };
        }

        if (mileageNum > 10000000) {
            return {
                valid: false,
                field: 'mileage',
                message: 'Vehicle mileage exceeds maximum allowed value'
            };
        }

        return { valid: true };
    }

    /**
     * Validate all vehicle fields
     * @returns {Object} Validation result with array of errors
     */
    validate() {
        const errors = [];

        const idValidation = this.validateId();
        if (!idValidation.valid) {
            errors.push(idValidation);
        }

        const makeValidation = this.validateMake();
        if (!makeValidation.valid) {
            errors.push(makeValidation);
        }

        const modelValidation = this.validateModel();
        if (!modelValidation.valid) {
            errors.push(modelValidation);
        }

        const yearValidation = this.validateYear();
        if (!yearValidation.valid) {
            errors.push(yearValidation);
        }

        const mileageValidation = this.validateMileage();
        if (!mileageValidation.valid) {
            errors.push(mileageValidation);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Serialize the vehicle to a plain object for storage
     * @returns {Object} Serialized vehicle data
     */
    toJSON() {
        return {
            id: this.id,
            make: this.make,
            model: this.model,
            year: this.year,
            mileage: this.mileage,
            createdAt: this.createdAt,
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Deserialize a plain object into a Vehicle instance
     * @param {Object} data - Plain object data
     * @returns {Vehicle} Vehicle instance
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data provided for Vehicle deserialization');
        }

        return new Vehicle({
            id: data.id,
            make: data.make,
            model: data.model,
            year: data.year,
            mileage: data.mileage,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }

    /**
     * Update vehicle properties with validation
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
            make: this.make,
            model: this.model,
            year: this.year,
            mileage: this.mileage
        };

        try {
            // Apply updates
            if (updates.make !== undefined) {
                this.make = updates.make;
            }
            if (updates.model !== undefined) {
                this.model = updates.model;
            }
            if (updates.year !== undefined) {
                this.year = updates.year;
            }
            if (updates.mileage !== undefined) {
                this.mileage = updates.mileage;
            }

            // Validate updated vehicle
            const validation = this.validate();
            if (!validation.valid) {
                // Rollback changes
                this.make = originalValues.make;
                this.model = originalValues.model;
                this.year = originalValues.year;
                this.mileage = originalValues.mileage;

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
                message: 'Vehicle updated successfully'
            };
        } catch (error) {
            // Rollback on error
            this.make = originalValues.make;
            this.model = originalValues.model;
            this.year = originalValues.year;
            this.mileage = originalValues.mileage;

            return {
                success: false,
                message: 'Error updating vehicle',
                error: error.message
            };
        }
    }

    /**
     * Get a display string for the vehicle
     * @returns {string} Display string
     */
    toString() {
        return `${this.year} ${this.make} ${this.model} (${this.mileage} miles)`;
    }
}

// Export the Vehicle class
export { Vehicle };
