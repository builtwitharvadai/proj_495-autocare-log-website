/**
 * Currency Formatter Utility
 *
 * Utility functions for formatting currency values, parsing currency input,
 * and validating monetary amounts with decimal precision and locale-aware formatting.
 */

/**
 * Format a numeric value as currency
 * @param {number|string} value - Value to format
 * @param {Object} options - Formatting options
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @param {string} options.currency - Currency code (default: 'USD')
 * @param {number} options.minimumFractionDigits - Minimum decimal places (default: 2)
 * @param {number} options.maximumFractionDigits - Maximum decimal places (default: 2)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, options = {}) {
    try {
        const {
            locale = 'en-US',
            currency = 'USD',
            minimumFractionDigits = 2,
            maximumFractionDigits = 2
        } = options;

        // Parse the value to number
        const numericValue = parseFloat(value);

        // Check for invalid number
        if (isNaN(numericValue)) {
            console.error('Invalid value provided for currency formatting:', value);
            return '$0.00';
        }

        // Format using Intl.NumberFormat
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: minimumFractionDigits,
            maximumFractionDigits: maximumFractionDigits
        });

        return formatter.format(numericValue);
    } catch (error) {
        console.error('Error formatting currency:', error.message);
        return '$0.00';
    }
}

/**
 * Format a numeric value as currency without symbol
 * @param {number|string} value - Value to format
 * @param {number} decimalPlaces - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export function formatCurrencyValue(value, decimalPlaces = 2) {
    try {
        const numericValue = parseFloat(value);

        if (isNaN(numericValue)) {
            console.error('Invalid value provided:', value);
            return '0.00';
        }

        return numericValue.toFixed(decimalPlaces);
    } catch (error) {
        console.error('Error formatting currency value:', error.message);
        return '0.00';
    }
}

/**
 * Parse currency input string to numeric value
 * @param {string} currencyString - Currency string to parse
 * @returns {number|null} Parsed numeric value or null if invalid
 */
export function parseCurrency(currencyString) {
    if (!currencyString) {
        return null;
    }

    try {
        // Convert to string if not already
        const str = String(currencyString);

        // Remove currency symbols, spaces, and commas
        const cleanedString = str
            .replace(/[$€£¥₹]/g, '')
            .replace(/,/g, '')
            .replace(/\s/g, '')
            .trim();

        // Parse as float
        const numericValue = parseFloat(cleanedString);

        // Return null if invalid
        if (isNaN(numericValue)) {
            console.warn('Invalid currency string:', currencyString);
            return null;
        }

        return numericValue;
    } catch (error) {
        console.error('Error parsing currency:', error.message);
        return null;
    }
}

/**
 * Validate currency amount
 * @param {number|string} amount - Amount to validate
 * @param {Object} options - Validation options
 * @param {number} options.min - Minimum allowed value (default: 0)
 * @param {number} options.max - Maximum allowed value (default: 1000000)
 * @param {boolean} options.allowNegative - Allow negative values (default: false)
 * @returns {Object} Validation result with valid flag and message
 */
export function validateCurrencyAmount(amount, options = {}) {
    const {
        min = 0,
        max = 1000000,
        allowNegative = false
    } = options;

    if (amount === null || amount === undefined || amount === '') {
        return {
            valid: false,
            message: 'Amount is required'
        };
    }

    try {
        // Parse the amount
        const numericAmount = typeof amount === 'number' ? amount : parseCurrency(amount);

        if (numericAmount === null || isNaN(numericAmount)) {
            return {
                valid: false,
                message: 'Invalid amount format'
            };
        }

        // Check for negative values
        if (!allowNegative && numericAmount < 0) {
            return {
                valid: false,
                message: 'Amount cannot be negative'
            };
        }

        // Check minimum value
        if (numericAmount < min) {
            return {
                valid: false,
                message: `Amount must be at least ${formatCurrency(min)}`
            };
        }

        // Check maximum value
        if (numericAmount > max) {
            return {
                valid: false,
                message: `Amount cannot exceed ${formatCurrency(max)}`
            };
        }

        // Check decimal precision (max 2 decimal places)
        const decimalPart = String(numericAmount).split('.')[1];
        if (decimalPart && decimalPart.length > 2) {
            return {
                valid: false,
                message: 'Amount can have at most 2 decimal places'
            };
        }

        return {
            valid: true,
            value: numericAmount
        };
    } catch (error) {
        console.error('Error validating currency amount:', error.message);
        return {
            valid: false,
            message: 'Error validating amount'
        };
    }
}

/**
 * Format input field value as currency while typing
 * @param {HTMLInputElement} inputElement - Input element to format
 * @param {Object} options - Formatting options
 * @returns {Function} Cleanup function to remove event listeners
 */
export function setupCurrencyInput(inputElement, options = {}) {
    if (!inputElement || !(inputElement instanceof HTMLInputElement)) {
        console.error('Invalid input element provided');
        return () => {};
    }

    const {
        allowNegative = false,
        maxValue = 1000000
    } = options;

    /**
     * Handle input event
     */
    const handleInput = (event) => {
        let value = event.target.value;

        // Remove non-numeric characters except decimal point and minus
        if (allowNegative) {
            value = value.replace(/[^0-9.-]/g, '');
        } else {
            value = value.replace(/[^0-9.]/g, '');
        }

        // Ensure only one decimal point
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }

        // Limit decimal places to 2
        if (parts.length === 2 && parts[1].length > 2) {
            value = parts[0] + '.' + parts[1].substring(0, 2);
        }

        // Apply max value constraint
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue) && numericValue > maxValue) {
            value = String(maxValue);
        }

        event.target.value = value;
    };

    /**
     * Handle blur event to format the final value
     */
    const handleBlur = (event) => {
        const value = event.target.value;
        if (value === '' || value === '-') {
            event.target.value = '';
            return;
        }

        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
            event.target.value = formatCurrencyValue(numericValue);
        }
    };

    // Attach event listeners
    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('blur', handleBlur);

    // Return cleanup function
    return () => {
        inputElement.removeEventListener('input', handleInput);
        inputElement.removeEventListener('blur', handleBlur);
    };
}

/**
 * Get currency symbol for a given currency code
 * @param {string} currencyCode - Currency code (e.g., 'USD', 'EUR')
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode = 'USD', locale = 'en-US') {
    try {
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });

        // Format 0 and extract the symbol
        const formatted = formatter.format(0);
        const symbol = formatted.replace(/[0-9]/g, '').trim();

        return symbol || '$';
    } catch (error) {
        console.error('Error getting currency symbol:', error.message);
        return '$';
    }
}

/**
 * Round currency value to nearest cent
 * @param {number} value - Value to round
 * @returns {number} Rounded value
 */
export function roundToCent(value) {
    if (typeof value !== 'number' || isNaN(value)) {
        console.error('Invalid value for rounding:', value);
        return 0;
    }

    return Math.round(value * 100) / 100;
}

/**
 * Convert cents to dollars
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in dollars
 */
export function centsToDollars(cents) {
    if (typeof cents !== 'number' || isNaN(cents)) {
        console.error('Invalid cents value:', cents);
        return 0;
    }

    return cents / 100;
}

/**
 * Convert dollars to cents
 * @param {number} dollars - Amount in dollars
 * @returns {number} Amount in cents
 */
export function dollarsToCents(dollars) {
    if (typeof dollars !== 'number' || isNaN(dollars)) {
        console.error('Invalid dollars value:', dollars);
        return 0;
    }

    return Math.round(dollars * 100);
}
