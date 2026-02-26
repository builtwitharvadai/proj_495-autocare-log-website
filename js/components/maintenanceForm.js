/**
 * Maintenance Form Component
 *
 * ES6 module for maintenance log entry form with comprehensive validation,
 * character counter for description, currency formatting for cost,
 * and integration with dataManager for saving records.
 */

import { dataManager } from '../services/dataManager.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';

/**
 * Service types available for maintenance records
 */
const SERVICE_TYPES = [
    'Oil Change',
    'Tire Rotation',
    'Brake Service',
    'Engine Tune-up',
    'Transmission Service',
    'Battery Replacement',
    'Air Filter Replacement',
    'Inspection',
    'Repair',
    'Other'
];

/**
 * Maximum character length for description field
 */
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Maintenance Form class
 */
class MaintenanceForm {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = null;
        this.form = null;
        this.isInitialized = false;
        this.currentRecordId = null;
        this.currentVehicleId = null;
        this.onSubmitCallback = null;
        this.onCancelCallback = null;
        this.currencyCleanup = null;
    }

    /**
     * Initialize the maintenance form
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

            console.log('Maintenance form initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing maintenance form:', error.message);
            return false;
        }
    }

    /**
     * Render the maintenance form HTML
     */
    render() {
        if (!this.container) {
            console.error('Container not found');
            return;
        }

        const serviceTypeOptions = SERVICE_TYPES.map(type =>
            `<option value="${type}">${type}</option>`
        ).join('');

        const formHTML = `
            <div class="maintenance-form-wrapper">
                <form id="maintenance-form" class="maintenance-form" novalidate>
                    <div class="form-group">
                        <label for="maintenance-date" class="form-label">
                            Service Date <span class="required">*</span>
                        </label>
                        <input
                            type="date"
                            id="maintenance-date"
                            name="date"
                            class="form-input"
                            required
                            aria-required="true"
                            aria-describedby="date-hint"
                        />
                        <span id="date-hint" class="form-hint">Enter the date of service</span>
                    </div>

                    <div class="form-group">
                        <label for="maintenance-service-type" class="form-label">
                            Service Type <span class="required">*</span>
                        </label>
                        <select
                            id="maintenance-service-type"
                            name="serviceType"
                            class="form-select"
                            required
                            aria-required="true"
                            aria-describedby="service-type-hint"
                        >
                            <option value="">-- Select Service Type --</option>
                            ${serviceTypeOptions}
                        </select>
                        <span id="service-type-hint" class="form-hint">Select the type of maintenance performed</span>
                    </div>

                    <div class="form-group">
                        <label for="maintenance-description" class="form-label">
                            Description
                        </label>
                        <textarea
                            id="maintenance-description"
                            name="description"
                            class="form-textarea"
                            rows="5"
                            maxlength="${MAX_DESCRIPTION_LENGTH}"
                            placeholder="Enter detailed description of the maintenance work..."
                            aria-describedby="description-hint description-counter"
                        ></textarea>
                        <div class="form-hint-group">
                            <span id="description-hint" class="form-hint">Provide details about the service</span>
                            <span id="description-counter" class="character-counter" aria-live="polite">
                                0 / ${MAX_DESCRIPTION_LENGTH}
                            </span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="maintenance-cost" class="form-label">
                            Cost <span class="required">*</span>
                        </label>
                        <div class="input-with-prefix">
                            <span class="input-prefix" aria-hidden="true">$</span>
                            <input
                                type="text"
                                id="maintenance-cost"
                                name="cost"
                                class="form-input has-prefix"
                                placeholder="0.00"
                                required
                                aria-required="true"
                                aria-describedby="cost-hint"
                                inputmode="decimal"
                            />
                        </div>
                        <span id="cost-hint" class="form-hint">Enter the total cost of service</span>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            Save Maintenance Record
                        </button>
                        <button type="button" class="btn btn-secondary" id="maintenance-form-cancel">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-tertiary" id="maintenance-form-reset">
                            Reset Form
                        </button>
                    </div>
                </form>
            </div>
        `;

        this.container.innerHTML = formHTML;
        this.form = document.getElementById('maintenance-form');
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
        const cancelBtn = document.getElementById('maintenance-form-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', this.handleCancel.bind(this));
        }

        // Reset button
        const resetBtn = document.getElementById('maintenance-form-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.handleReset.bind(this));
        }

        // Setup field-specific listeners
        this.setupFieldValidation();
    }

    /**
     * Setup validation and formatting for form fields
     */
    setupFieldValidation() {
        // Date field validation
        const dateInput = document.getElementById('maintenance-date');
        if (dateInput) {
            dateInput.addEventListener('blur', () => this.validateDateField(dateInput));
            dateInput.addEventListener('change', () => this.validateDateField(dateInput));
        }

        // Service type validation
        const serviceTypeSelect = document.getElementById('maintenance-service-type');
        if (serviceTypeSelect) {
            serviceTypeSelect.addEventListener('blur', () => this.validateServiceTypeField(serviceTypeSelect));
            serviceTypeSelect.addEventListener('change', () => this.validateServiceTypeField(serviceTypeSelect));
        }

        // Description character counter
        const descriptionTextarea = document.getElementById('maintenance-description');
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('input', () => this.updateCharacterCounter(descriptionTextarea));
            descriptionTextarea.addEventListener('blur', () => this.validateDescriptionField(descriptionTextarea));
        }

        // Cost field formatting and validation
        const costInput = document.getElementById('maintenance-cost');
        if (costInput) {
            this.setupCostInput(costInput);
        }
    }

    /**
     * Validate date field
     * @param {HTMLInputElement} inputElement - Date input element
     */
    validateDateField(inputElement) {
        const value = inputElement.value;
        const result = this.validateDate(value);

        this.displayValidationResult(inputElement, result);
    }

    /**
     * Validate date value
     * @param {string} date - Date string
     * @returns {Object} Validation result
     */
    validateDate(date) {
        if (!date || date.trim() === '') {
            return {
                valid: false,
                field: 'date',
                message: 'Service date is required'
            };
        }

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) {
            return {
                valid: false,
                field: 'date',
                message: 'Invalid date format'
            };
        }

        // Check if date is not in the future
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        if (dateObj > today) {
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

        return { valid: true, field: 'date' };
    }

    /**
     * Validate service type field
     * @param {HTMLSelectElement} selectElement - Service type select element
     */
    validateServiceTypeField(selectElement) {
        const value = selectElement.value;
        const result = this.validateServiceType(value);

        this.displayValidationResult(selectElement, result);
    }

    /**
     * Validate service type value
     * @param {string} serviceType - Service type value
     * @returns {Object} Validation result
     */
    validateServiceType(serviceType) {
        if (!serviceType || serviceType.trim() === '') {
            return {
                valid: false,
                field: 'serviceType',
                message: 'Service type is required'
            };
        }

        if (serviceType.length > 100) {
            return {
                valid: false,
                field: 'serviceType',
                message: 'Service type must be 100 characters or less'
            };
        }

        return { valid: true, field: 'serviceType' };
    }

    /**
     * Update character counter for description field
     * @param {HTMLTextAreaElement} textareaElement - Description textarea element
     */
    updateCharacterCounter(textareaElement) {
        const counter = document.getElementById('description-counter');
        if (!counter) {
            return;
        }

        const length = textareaElement.value.length;
        counter.textContent = `${length} / ${MAX_DESCRIPTION_LENGTH}`;

        // Update counter color based on character count
        if (length > MAX_DESCRIPTION_LENGTH * 0.9) {
            counter.style.color = 'var(--color-error)';
        } else if (length > MAX_DESCRIPTION_LENGTH * 0.7) {
            counter.style.color = 'var(--color-warning)';
        } else {
            counter.style.color = 'var(--color-text-disabled)';
        }
    }

    /**
     * Validate description field
     * @param {HTMLTextAreaElement} textareaElement - Description textarea element
     */
    validateDescriptionField(textareaElement) {
        const value = textareaElement.value;
        const result = this.validateDescription(value);

        this.displayValidationResult(textareaElement, result);
    }

    /**
     * Validate description value
     * @param {string} description - Description value
     * @returns {Object} Validation result
     */
    validateDescription(description) {
        if (description && description.length > MAX_DESCRIPTION_LENGTH) {
            return {
                valid: false,
                field: 'description',
                message: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less`
            };
        }

        return { valid: true, field: 'description' };
    }

    /**
     * Setup cost input with formatting and validation
     * @param {HTMLInputElement} inputElement - Cost input element
     */
    setupCostInput(inputElement) {
        // Input event - restrict to valid characters
        const handleInput = (event) => {
            let value = event.target.value;

            // Remove non-numeric characters except decimal point
            value = value.replace(/[^0-9.]/g, '');

            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }

            // Limit decimal places to 2
            if (parts.length === 2 && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
            }

            // Limit to max value
            const numericValue = parseFloat(value);
            if (!isNaN(numericValue) && numericValue > 1000000) {
                value = '1000000.00';
            }

            event.target.value = value;
        };

        // Blur event - format the value
        const handleBlur = (event) => {
            const value = event.target.value;

            if (value === '' || value === '.') {
                event.target.value = '';
                this.validateCostField(event.target);
                return;
            }

            const numericValue = parseFloat(value);
            if (!isNaN(numericValue)) {
                event.target.value = numericValue.toFixed(2);
            }

            this.validateCostField(event.target);
        };

        inputElement.addEventListener('input', handleInput);
        inputElement.addEventListener('blur', handleBlur);

        // Store cleanup function
        this.currencyCleanup = () => {
            inputElement.removeEventListener('input', handleInput);
            inputElement.removeEventListener('blur', handleBlur);
        };
    }

    /**
     * Validate cost field
     * @param {HTMLInputElement} inputElement - Cost input element
     */
    validateCostField(inputElement) {
        const value = inputElement.value;
        const result = this.validateCost(value);

        this.displayValidationResult(inputElement, result);
    }

    /**
     * Validate cost value
     * @param {string|number} cost - Cost value
     * @returns {Object} Validation result
     */
    validateCost(cost) {
        if (cost === null || cost === undefined || cost === '') {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost is required'
            };
        }

        const numericCost = parseFloat(cost);
        if (isNaN(numericCost)) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost must be a valid number'
            };
        }

        if (numericCost < 0) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost cannot be negative'
            };
        }

        if (numericCost > 1000000) {
            return {
                valid: false,
                field: 'cost',
                message: 'Cost exceeds maximum allowed value'
            };
        }

        return { valid: true, field: 'cost' };
    }

    /**
     * Display validation result on an input element
     * @param {HTMLElement} element - Form element
     * @param {Object} result - Validation result
     */
    displayValidationResult(element, result) {
        if (!element) {
            return;
        }

        const formGroup = element.closest('.form-group');
        if (!formGroup) {
            return;
        }

        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Remove validation classes
        element.classList.remove('is-valid', 'is-invalid');

        if (result.valid) {
            element.classList.add('is-valid');
        } else {
            element.classList.add('is-invalid');

            // Create and append error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = result.message;
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'polite');
            formGroup.appendChild(errorDiv);
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
            this.clearFormError();

            // Get form data
            const formData = new FormData(this.form);
            const maintenanceData = {
                date: formData.get('date') || '',
                serviceType: formData.get('serviceType')?.trim() || '',
                description: formData.get('description')?.trim() || '',
                cost: formData.get('cost') ? parseFloat(formData.get('cost')) : 0,
                vehicleId: this.currentVehicleId || ''
            };

            // Validate all fields
            const validation = this.validateAllFields(maintenanceData);

            if (!validation.valid) {
                console.warn('Form validation failed', validation.errors);

                if (validation.errors.length > 0) {
                    this.showFormError(validation.errors[0].message);
                }

                return;
            }

            // Ensure vehicle ID is set
            if (!maintenanceData.vehicleId) {
                this.showFormError('Please select a vehicle before adding maintenance records');
                return;
            }

            // Create or update maintenance record
            let result;

            if (this.currentRecordId) {
                // Update existing record
                result = dataManager.updateMaintenanceRecord(this.currentRecordId, maintenanceData);
                console.log('Maintenance record update result:', result);
            } else {
                // Create new maintenance record using MaintenanceRecord model
                const record = new MaintenanceRecord(maintenanceData);
                const recordValidation = record.validate();

                if (!recordValidation.valid) {
                    console.warn('Maintenance record model validation failed', recordValidation.errors);
                    this.showFormError(recordValidation.errors[0].message);
                    return;
                }

                result = dataManager.addMaintenanceRecord(record.toJSON());
                console.log('Maintenance record add result:', result);
            }

            if (result.success) {
                console.log('Maintenance record saved successfully:', result.data);

                // Reset form
                this.resetForm();

                // Call success callback if provided
                if (this.onSubmitCallback && typeof this.onSubmitCallback === 'function') {
                    this.onSubmitCallback(result.data);
                }

                // Show success message
                this.showSuccessMessage(
                    this.currentRecordId ? 'Maintenance record updated successfully!' : 'Maintenance record added successfully!'
                );

                // Clear current record ID
                this.currentRecordId = null;
            } else {
                console.error('Failed to save maintenance record:', result.message);
                this.showFormError(result.message || 'Failed to save maintenance record. Please try again.');
            }
        } catch (error) {
            console.error('Error submitting maintenance form:', error.message);
            this.showFormError('An unexpected error occurred. Please try again.');
        }
    }

    /**
     * Validate all maintenance form fields
     * @param {Object} formData - Form data to validate
     * @returns {Object} Validation result with errors array
     */
    validateAllFields(formData) {
        const errors = [];

        const dateResult = this.validateDate(formData.date);
        if (!dateResult.valid) {
            errors.push(dateResult);
        }

        const serviceTypeResult = this.validateServiceType(formData.serviceType);
        if (!serviceTypeResult.valid) {
            errors.push(serviceTypeResult);
        }

        const descriptionResult = this.validateDescription(formData.description);
        if (!descriptionResult.valid) {
            errors.push(descriptionResult);
        }

        const costResult = this.validateCost(formData.cost);
        if (!costResult.valid) {
            errors.push(costResult);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Handle cancel button click
     */
    handleCancel() {
        this.resetForm();
        this.currentRecordId = null;

        if (this.onCancelCallback && typeof this.onCancelCallback === 'function') {
            this.onCancelCallback();
        }

        console.log('Maintenance form cancelled');
    }

    /**
     * Handle reset button click
     */
    handleReset() {
        this.resetForm();
        console.log('Maintenance form reset');
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
        const inputs = this.form.querySelectorAll('.form-input, .form-select, .form-textarea');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
            const formGroup = input.closest('.form-group');
            if (formGroup) {
                const errorMsg = formGroup.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.remove();
                }
            }
        });

        // Reset character counter
        const counter = document.getElementById('description-counter');
        if (counter) {
            counter.textContent = `0 / ${MAX_DESCRIPTION_LENGTH}`;
            counter.style.color = 'var(--color-text-disabled)';
        }

        // Clear form-level errors
        this.clearFormError();

        // Clear current record ID
        this.currentRecordId = null;
    }

    /**
     * Set the vehicle ID for new maintenance records
     * @param {string} vehicleId - Vehicle ID
     */
    setVehicleId(vehicleId) {
        this.currentVehicleId = vehicleId;
        console.log('Maintenance form vehicle ID set:', vehicleId);
    }

    /**
     * Load maintenance record for editing
     * @param {string} recordId - Maintenance record ID
     * @returns {boolean} Success status
     */
    loadMaintenanceRecord(recordId) {
        if (!recordId) {
            console.error('Maintenance record ID is required');
            return false;
        }

        try {
            const record = dataManager.getMaintenanceRecordById(recordId);

            if (!record) {
                console.error(`Maintenance record with ID ${recordId} not found`);
                return false;
            }

            // Populate form fields
            const dateInput = document.getElementById('maintenance-date');
            const serviceTypeSelect = document.getElementById('maintenance-service-type');
            const descriptionTextarea = document.getElementById('maintenance-description');
            const costInput = document.getElementById('maintenance-cost');

            if (dateInput && record.date) {
                // Convert ISO date to YYYY-MM-DD format
                const dateObj = new Date(record.date);
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                dateInput.value = `${year}-${month}-${day}`;
            }

            if (serviceTypeSelect) {
                serviceTypeSelect.value = record.serviceType || '';
            }

            if (descriptionTextarea) {
                descriptionTextarea.value = record.description || '';
                this.updateCharacterCounter(descriptionTextarea);
            }

            if (costInput && typeof record.cost === 'number') {
                costInput.value = record.cost.toFixed(2);
            }

            // Store current record ID and vehicle ID
            this.currentRecordId = recordId;
            this.currentVehicleId = record.vehicleId;

            console.log('Maintenance record loaded for editing:', recordId);
            return true;
        } catch (error) {
            console.error('Error loading maintenance record:', error.message);
            return false;
        }
    }

    /**
     * Show form-level error message
     * @param {string} message - Error message
     */
    showFormError(message) {
        if (!this.form || !message) {
            return;
        }

        this.clearFormError();

        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error-message';
        errorDiv.textContent = message;
        errorDiv.setAttribute('role', 'alert');
        errorDiv.setAttribute('aria-live', 'assertive');

        this.form.insertBefore(errorDiv, this.form.firstChild);
    }

    /**
     * Clear form-level error message
     */
    clearFormError() {
        if (!this.form) {
            return;
        }

        const existingError = this.form.querySelector('.form-error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    /**
     * Show success message
     * @param {string} message - Success message
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
        // Cleanup currency input listeners
        if (this.currencyCleanup && typeof this.currencyCleanup === 'function') {
            this.currencyCleanup();
        }

        if (this.container) {
            this.container.innerHTML = '';
        }

        this.form = null;
        this.isInitialized = false;
        this.currentRecordId = null;
        this.currentVehicleId = null;

        console.log('Maintenance form destroyed');
    }
}

/**
 * Create and initialize a maintenance form
 * @param {string} containerId - Container element ID
 * @returns {MaintenanceForm} Maintenance form instance
 */
export function createMaintenanceForm(containerId) {
    const form = new MaintenanceForm(containerId);
    form.initialize();
    return form;
}

export { MaintenanceForm };
