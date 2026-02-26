/**
 * Vehicle Form Component
 *
 * ES6 module that creates and manages the vehicle information form with
 * validation integration and data submission to dataManager.
 */

import { dataManager } from '../services/dataManager.js';
import { Vehicle } from '../models/Vehicle.js';
import {
    validateMake,
    validateModel,
    validateYear,
    validateMileage,
    setupRealTimeValidation,
    clearValidation,
    validateAllFields,
    showFormError,
    clearFormError
} from '../utils/formValidator.js';

/**
 * Vehicle Form class
 */
class VehicleForm {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.form = null;
        this.isInitialized = false;
        this.currentVehicleId = null;
        this.onSubmitCallback = null;
        this.onCancelCallback = null;
    }

    /**
     * Initialize the vehicle form
     * @returns {boolean} Success status
     */
    initialize() {
        try {
            this.container = document.getElementById(this.containerId);

            if (!this.container) {
                console.error(`Container with ID '${this.containerId}' not found`);
                return false;
            }

            this.render();
            this.setupEventListeners();
            this.isInitialized = true;

            console.log('Vehicle form initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing vehicle form:', error.message);
            return false;
        }
    }

    /**
     * Render the vehicle form HTML
     */
    render() {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        const formHTML = `
            <div class="vehicle-form-wrapper">
                <form id="vehicle-form" class="vehicle-form" novalidate>
                    <div class="form-group">
                        <label for="vehicle-make" class="form-label">
                            Make <span class="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="vehicle-make"
                            name="make"
                            class="form-input"
                            placeholder="e.g., Toyota, Honda, Ford"
                            required
                            aria-required="true"
                            aria-describedby="make-hint"
                        />
                        <span id="make-hint" class="form-hint">Enter the vehicle manufacturer</span>
                    </div>

                    <div class="form-group">
                        <label for="vehicle-model" class="form-label">
                            Model <span class="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="vehicle-model"
                            name="model"
                            class="form-input"
                            placeholder="e.g., Camry, Civic, F-150"
                            required
                            aria-required="true"
                            aria-describedby="model-hint"
                        />
                        <span id="model-hint" class="form-hint">Enter the vehicle model</span>
                    </div>

                    <div class="form-group">
                        <label for="vehicle-year" class="form-label">
                            Year <span class="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="vehicle-year"
                            name="year"
                            class="form-input"
                            placeholder="e.g., 2020"
                            min="1886"
                            max="${new Date().getFullYear() + 1}"
                            required
                            aria-required="true"
                            aria-describedby="year-hint"
                        />
                        <span id="year-hint" class="form-hint">Enter the manufacturing year</span>
                    </div>

                    <div class="form-group">
                        <label for="vehicle-mileage" class="form-label">
                            Mileage <span class="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="vehicle-mileage"
                            name="mileage"
                            class="form-input"
                            placeholder="e.g., 50000"
                            min="0"
                            max="10000000"
                            step="1"
                            required
                            aria-required="true"
                            aria-describedby="mileage-hint"
                        />
                        <span id="mileage-hint" class="form-hint">Enter the current mileage</span>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            Save Vehicle
                        </button>
                        <button type="button" class="btn btn-secondary" id="vehicle-form-cancel">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-tertiary" id="vehicle-form-reset">
                            Reset Form
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.container.innerHTML = formHTML;
        this.form = document.getElementById('vehicle-form');
    }

    /**
     * Setup event listeners for the form
     */
    setupEventListeners() {
        if (!this.form) {
            console.error('Form not found');
            return;
        }

        // Form submission
        this.form.addEventListener('submit', this.handleSubmit.bind(this));

        // Cancel button
        const cancelBtn = document.getElementById('vehicle-form-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.handleCancel.bind(this));
        }

        // Reset button
        const resetBtn = document.getElementById('vehicle-form-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.handleReset.bind(this));
        }

        // Setup real-time validation for each field
        this.setupFieldValidation();
    }

    /**
     * Setup real-time validation for form fields
     */
    setupFieldValidation() {
        const makeInput = document.getElementById('vehicle-make');
        const modelInput = document.getElementById('vehicle-model');
        const yearInput = document.getElementById('vehicle-year');
        const mileageInput = document.getElementById('vehicle-mileage');

        if (makeInput) {
            setupRealTimeValidation(makeInput, validateMake);
        }

        if (modelInput) {
            setupRealTimeValidation(modelInput, validateModel);
        }

        if (yearInput) {
            setupRealTimeValidation(yearInput, validateYear);
        }

        if (mileageInput) {
            setupRealTimeValidation(mileageInput, validateMileage);
        }
    }

    /**
     * Handle form submission
     * @param {Event} event - Submit event
     */
    async handleSubmit(event) {
        event.preventDefault();

        if (!this.form) {
            console.error('Form not found');
            return;
        }

        try {
            // Clear previous form errors
            clearFormError(this.form);

            // Get form data
            const formData = new FormData(this.form);
            const vehicleData = {
                make: formData.get('make')?.trim() || '',
                model: formData.get('model')?.trim() || '',
                year: formData.get('year') ? Number(formData.get('year')) : null,
                mileage: formData.get('mileage') ? Number(formData.get('mileage')) : 0
            };

            // Validate all fields
            const validation = validateAllFields(vehicleData);

            if (!validation.valid) {
                console.warn('Form validation failed', validation.errors);

                // Display first error as form-level error
                if (validation.errors.length > 0) {
                    showFormError(this.form, validation.errors[0].message);
                }

                return;
            }

            // Create or update vehicle
            let result;

            if (this.currentVehicleId) {
                // Update existing vehicle
                result = dataManager.updateVehicle(this.currentVehicleId, vehicleData);
                console.log('Vehicle update result:', result);
            } else {
                // Create new vehicle using Vehicle model
                const vehicle = new Vehicle(vehicleData);
                const vehicleValidation = vehicle.validate();

                if (!vehicleValidation.valid) {
                    console.warn('Vehicle model validation failed', vehicleValidation.errors);
                    showFormError(this.form, vehicleValidation.errors[0].message);
                    return;
                }

                result = dataManager.addVehicle(vehicle.toJSON());
                console.log('Vehicle add result:', result);
            }

            if (result.success) {
                console.log('Vehicle saved successfully:', result.data);

                // Reset form
                this.resetForm();

                // Call success callback if provided
                if (this.onSubmitCallback && typeof this.onSubmitCallback === 'function') {
                    this.onSubmitCallback(result.data);
                }

                // Show success message
                this.showSuccessMessage(
                    this.currentVehicleId ? 'Vehicle updated successfully!' : 'Vehicle added successfully!'
                );

                // Clear current vehicle ID
                this.currentVehicleId = null;
            } else {
                console.error('Failed to save vehicle:', result.message);
                showFormError(this.form, result.message || 'Failed to save vehicle. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting vehicle form:', error.message);
            showFormError(this.form, 'An unexpected error occurred. Please try again.');
        }
    }

    /**
     * Handle cancel button click
     */
    handleCancel() {
        this.resetForm();
        this.currentVehicleId = null;

        if (this.onCancelCallback && typeof this.onCancelCallback === 'function') {
            this.onCancelCallback();
        }

        console.log('Vehicle form cancelled');
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        this.resetForm();
        console.log('Vehicle form reset');
    }

    /**
     * Reset the form to its initial state
     */
    resetForm() {
        if (!this.form) {
            return;
        }

        // Reset form fields
        this.form.reset();

        // Clear validation states
        const inputs = this.form.querySelectorAll('.form-input');
        inputs.forEach(input => {
            clearValidation(input);
        });

        // Clear form-level errors
        clearFormError(this.form);

        // Clear current vehicle ID
        this.currentVehicleId = null;
    }

    /**
     * Load vehicle data into the form for editing
     * @param {string} vehicleId - Vehicle ID to load
     * @returns {boolean} Success status
     */
    loadVehicle(vehicleId) {
        if (!vehicleId) {
            console.error('Vehicle ID is required');
            return false;
        }

        try {
            const vehicle = dataManager.getVehicleById(vehicleId);

            if (!vehicle) {
                console.error(`Vehicle with ID ${vehicleId} not found`);
                return false;
            }

            // Populate form fields
            const makeInput = document.getElementById('vehicle-make');
            const modelInput = document.getElementById('vehicle-model');
            const yearInput = document.getElementById('vehicle-year');
            const mileageInput = document.getElementById('vehicle-mileage');

            if (makeInput) makeInput.value = vehicle.make || '';
            if (modelInput) modelInput.value = vehicle.model || '';
            if (yearInput) yearInput.value = vehicle.year || '';
            if (mileageInput) mileageInput.value = vehicle.mileage || 0;

            // Store current vehicle ID
            this.currentVehicleId = vehicleId;

            console.log('Vehicle data loaded for editing:', vehicleId);
            return true;
        } catch (error) {
            console.error('Error loading vehicle data:', error.message);
            return false;
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message to display
     */
    showSuccessMessage(message) {
        if (!this.form) {
            return;
        }

        // Remove existing success message
        const existingSuccess = this.form.querySelector('.success-message');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // Create and prepend success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.setAttribute('role', 'status');
        successDiv.setAttribute('aria-live', 'polite');

        this.form.insertBefore(successDiv, this.form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 5000);
    }

    /**
     * Set callback for form submission
     * @param {Function} callback - Callback function
     */
    onSubmit(callback) {
        this.onSubmitCallback = callback;
    }

    /**
     * Set callback for form cancellation
     * @param {Function} callback - Callback function
     */
    onCancel(callback) {
        this.onCancelCallback = callback;
    }

    /**
     * Show the form
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
        }
    }

    /**
     * Hide the form
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
        }
    }

    /**
     * Destroy the form and cleanup
     */
    destroy() {
        if (this.form) {
            // Clear validation from all inputs
            const inputs = this.form.querySelectorAll('.form-input');
            inputs.forEach(input => {
                clearValidation(input);
            });
        }

        if (this.container) {
            this.container.innerHTML = '';
        }

        this.form = null;
        this.isInitialized = false;
        this.currentVehicleId = null;

        console.log('Vehicle form destroyed');
    }
}

/**
 * Create and initialize a vehicle form
 * @param {string} containerId - Container element ID
 * @returns {VehicleForm} Vehicle form instance
 */
export function createVehicleForm(containerId) {
    const form = new VehicleForm(containerId);
    form.initialize();
    return form;
}

export { VehicleForm };
