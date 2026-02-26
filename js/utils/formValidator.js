/**
 * Form Validator Utility
 *
 * Provides validation functions for vehicle form fields with real-time validation
 * capabilities and error message display.
 */

/**
 * Validate vehicle make field
 * @param {string} make - Vehicle make value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateMake(make) {
    if (!make || typeof make !== 'string') {
        return {
            valid: false,
            field: 'make',
            message: 'Vehicle make is required'
        };
    }

    const trimmedMake = make.trim();
    if (trimmedMake.length === 0) {
        return {
            valid: false,
            field: 'make',
            message: 'Vehicle make cannot be empty'
        };
    }

    if (trimmedMake.length < 2) {
        return {
            valid: false,
            field: 'make',
            message: 'Vehicle make must be at least 2 characters'
        };
    }

    if (trimmedMake.length > 100) {
        return {
            valid: false,
            field: 'make',
            message: 'Vehicle make must be 100 characters or less'
        };
    }

    return { valid: true, field: 'make' };
}

/**
 * Validate vehicle model field
 * @param {string} model - Vehicle model value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateModel(model) {
    if (!model || typeof model !== 'string') {
        return {
            valid: false,
            field: 'model',
            message: 'Vehicle model is required'
        };
    }

    const trimmedModel = model.trim();
    if (trimmedModel.length === 0) {
        return {
            valid: false,
            field: 'model',
            message: 'Vehicle model cannot be empty'
        };
    }

    if (trimmedModel.length < 1) {
        return {
            valid: false,
            field: 'model',
            message: 'Vehicle model must be at least 1 character'
        };
    }

    if (trimmedModel.length > 100) {
        return {
            valid: false,
            field: 'model',
            message: 'Vehicle model must be 100 characters or less'
        };
    }

    return { valid: true, field: 'model' };
}

/**
 * Validate vehicle year field
 * @param {number|string} year - Vehicle year value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateYear(year) {
    if (year === null || year === undefined || year === '') {
        return {
            valid: false,
            field: 'year',
            message: 'Vehicle year is required'
        };
    }

    const yearNum = Number(year);
    if (!Number.isInteger(yearNum) || isNaN(yearNum)) {
        return {
            valid: false,
            field: 'year',
            message: 'Vehicle year must be a valid number'
        };
    }

    const currentYear = new Date().getFullYear();
    const minYear = 1886;

    if (yearNum < minYear) {
        return {
            valid: false,
            field: 'year',
            message: `Vehicle year must be ${minYear} or later`
        };
    }

    if (yearNum > currentYear + 1) {
        return {
            valid: false,
            field: 'year',
            message: `Vehicle year cannot exceed ${currentYear + 1}`
        };
    }

    return { valid: true, field: 'year' };
}

/**
 * Validate vehicle mileage field
 * @param {number|string} mileage - Vehicle mileage value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateMileage(mileage) {
    if (mileage === null || mileage === undefined || mileage === '') {
        return {
            valid: false,
            field: 'mileage',
            message: 'Vehicle mileage is required'
        };
    }

    const mileageNum = Number(mileage);
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

    return { valid: true, field: 'mileage' };
}

/**
 * Setup real-time validation for a form input
 * @param {HTMLElement} inputElement - The input element to validate
 * @param {Function} validationFunction - The validation function to use
 * @param {Function} displayCallback - Callback to display validation result
 */
export function setupRealTimeValidation(inputElement, validationFunction, displayCallback) {
    if (!inputElement || !validationFunction) {
        console.error('Invalid parameters for setupRealTimeValidation');
        return;
    }

    const handleValidation = () => {
        const value = inputElement.value;
        const result = validationFunction(value);

        if (displayCallback && typeof displayCallback === 'function') {
            displayCallback(inputElement, result);
        } else {
            displayValidationResult(inputElement, result);
        }
    };

    // Validate on blur
    inputElement.addEventListener('blur', handleValidation);

    // Validate on input (debounced for better performance)
    let inputTimeout;
    inputElement.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(handleValidation, 300);
    });

    // Store cleanup function
    inputElement._cleanupValidation = () => {
        inputElement.removeEventListener('blur', handleValidation);
        clearTimeout(inputTimeout);
    };
}

/**
 * Display validation result on the input element
 * @param {HTMLElement} inputElement - The input element
 * @param {Object} result - Validation result object
 */
export function displayValidationResult(inputElement, result) {
    if (!inputElement) {
        return;
    }

    const formGroup = inputElement.closest('.form-group');
    if (!formGroup) {
        console.warn('Input element is not within a .form-group');
        return;
    }

    // Remove existing error message
    const existingError = formGroup.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }

    // Remove validation classes
    inputElement.classList.remove('is-valid', 'is-invalid');

    if (result.valid) {
        inputElement.classList.add('is-valid');
    } else {
        inputElement.classList.add('is-invalid');

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
 * Clear validation state from an input element
 * @param {HTMLElement} inputElement - The input element to clear
 */
export function clearValidation(inputElement) {
    if (!inputElement) {
        return;
    }

    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    inputElement.classList.remove('is-valid', 'is-invalid');

    // Clean up event listeners if they exist
    if (inputElement._cleanupValidation) {
        inputElement._cleanupValidation();
        delete inputElement._cleanupValidation;
    }
}

/**
 * Validate all fields in a form
 * @param {Object} formData - Object containing form field values
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateAllFields(formData) {
    const errors = [];

    if (!formData || typeof formData !== 'object') {
        return {
            valid: false,
            errors: [{ field: 'form', message: 'Invalid form data' }]
        };
    }

    // Validate make
    if (formData.make !== undefined) {
        const makeResult = validateMake(formData.make);
        if (!makeResult.valid) {
            errors.push(makeResult);
        }
    }

    // Validate model
    if (formData.model !== undefined) {
        const modelResult = validateModel(formData.model);
        if (!modelResult.valid) {
            errors.push(modelResult);
        }
    }

    // Validate year
    if (formData.year !== undefined) {
        const yearResult = validateYear(formData.year);
        if (!yearResult.valid) {
            errors.push(yearResult);
        }
    }

    // Validate mileage
    if (formData.mileage !== undefined) {
        const mileageResult = validateMileage(formData.mileage);
        if (!mileageResult.valid) {
            errors.push(mileageResult);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Show form-level error message
 * @param {HTMLElement} formElement - The form element
 * @param {string} message - Error message to display
 */
export function showFormError(formElement, message) {
    if (!formElement || !message) {
        return;
    }

    // Remove existing form error
    const existingError = formElement.querySelector('.form-error-message');
    if (existingError) {
        existingError.remove();
    }

    // Create and prepend error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');

    formElement.insertBefore(errorDiv, formElement.firstChild);
}

/**
 * Clear form-level error message
 * @param {HTMLElement} formElement - The form element
 */
export function clearFormError(formElement) {
    if (!formElement) {
        return;
    }

    const existingError = formElement.querySelector('.form-error-message');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Validate maintenance date field
 * @param {string} date - Date string
 * @returns {Object} Validation result with valid flag and message
 */
export function validateDate(date) {
    if (!date || typeof date !== 'string' || date.trim() === '') {
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

    return { valid: true, field: 'date' };
}

/**
 * Validate maintenance service type field
 * @param {string} serviceType - Service type value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateServiceType(serviceType) {
    if (!serviceType || typeof serviceType !== 'string') {
        return {
            valid: false,
            field: 'serviceType',
            message: 'Service type is required'
        };
    }

    const trimmedServiceType = serviceType.trim();
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

    return { valid: true, field: 'serviceType' };
}

/**
 * Validate maintenance description field
 * @param {string} description - Description value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateDescription(description) {
    // Description is optional, but if provided must meet constraints
    if (description === null || description === undefined) {
        return { valid: true, field: 'description' };
    }

    if (typeof description !== 'string') {
        return {
            valid: false,
            field: 'description',
            message: 'Description must be a string'
        };
    }

    const maxLength = 5000;
    if (description.length > maxLength) {
        return {
            valid: false,
            field: 'description',
            message: `Description must be ${maxLength} characters or less`
        };
    }

    return { valid: true, field: 'description' };
}

/**
 * Validate maintenance cost field
 * @param {number|string} cost - Cost value
 * @returns {Object} Validation result with valid flag and message
 */
export function validateCost(cost) {
    if (cost === null || cost === undefined || cost === '') {
        return {
            valid: false,
            field: 'cost',
            message: 'Cost is required'
        };
    }

    const costNum = Number(cost);
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

    // Check decimal precision (max 2 decimal places)
    const costStr = String(cost);
    const decimalPart = costStr.split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
        return {
            valid: false,
            field: 'cost',
            message: 'Cost can have at most 2 decimal places'
        };
    }

    return { valid: true, field: 'cost' };
}
