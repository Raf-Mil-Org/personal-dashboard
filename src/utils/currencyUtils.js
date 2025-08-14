/**
 * Currency utilities for consistent handling of monetary values
 * Best practices: Store as numbers, format for display, handle precision correctly
 */

// Default currency settings
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_LOCALE = 'en-US';

/**
 * Parse a currency string to a number
 * Handles various formats: "€1,234.56", "1234.56", "1,234.56", etc.
 */
export const parseCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (!value || value === '') return 0;

    // Remove currency symbols, spaces, and commas
    const cleaned = String(value)
        .replace(/[€$£¥₹₽₿]/g, '') // Remove currency symbols
        .replace(/\s/g, '') // Remove spaces
        .replace(/,/g, ''); // Remove thousand separators

    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format a number as currency for display
 */
export const formatCurrency = (amount, options = {}) => {
    const { currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE, minimumFractionDigits = 2, maximumFractionDigits = 2, useGrouping = true } = options;

    if (amount === null || amount === undefined || isNaN(amount)) {
        return formatCurrency(0, options);
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
    }).format(amount);
};

/**
 * Format a number as currency without the currency symbol (for calculations)
 */
export const formatAmount = (amount, options = {}) => {
    const { locale = DEFAULT_LOCALE, minimumFractionDigits = 2, maximumFractionDigits = 2, useGrouping = true } = options;

    if (amount === null || amount === undefined || isNaN(amount)) {
        return formatAmount(0, options);
    }

    return new Intl.NumberFormat(locale, {
        minimumFractionDigits,
        maximumFractionDigits,
        useGrouping
    }).format(amount);
};

/**
 * Safe addition of currency amounts (avoids floating-point precision issues)
 */
export const addAmounts = (...amounts) => {
    return amounts.reduce((sum, amount) => {
        const parsed = parseCurrency(amount);
        // Use integer arithmetic to avoid floating-point precision issues
        return Math.round((sum + parsed) * 100) / 100;
    }, 0);
};

/**
 * Safe subtraction of currency amounts
 */
export const subtractAmounts = (amount1, amount2) => {
    const parsed1 = parseCurrency(amount1);
    const parsed2 = parseCurrency(amount2);
    return Math.round((parsed1 - parsed2) * 100) / 100;
};

/**
 * Safe multiplication of currency amounts
 */
export const multiplyAmount = (amount, multiplier) => {
    const parsed = parseCurrency(amount);
    return Math.round(parsed * multiplier * 100) / 100;
};

/**
 * Check if amount is positive, negative, or zero
 */
export const getAmountType = (amount) => {
    const parsed = parseCurrency(amount);
    if (parsed > 0) return 'positive';
    if (parsed < 0) return 'negative';
    return 'zero';
};

/**
 * Get the absolute value of an amount
 */
export const getAbsoluteAmount = (amount) => {
    return Math.abs(parseCurrency(amount));
};

/**
 * Validate if a value is a valid currency amount
 */
export const isValidAmount = (value) => {
    if (typeof value === 'number') return !isNaN(value) && isFinite(value);
    if (typeof value === 'string') {
        const parsed = parseCurrency(value);
        return !isNaN(parsed) && isFinite(parsed);
    }
    return false;
};

/**
 * Convert amount to cents (integer) for precise calculations
 */
export const toCents = (amount) => {
    return Math.round(parseCurrency(amount) * 100);
};

/**
 * Convert cents back to amount
 */
export const fromCents = (cents) => {
    return cents / 100;
};

/**
 * Round amount to specified decimal places
 */
export const roundAmount = (amount, decimals = 2) => {
    const factor = Math.pow(10, decimals);
    return Math.round(parseCurrency(amount) * factor) / factor;
};

// Currency utility functions for handling euro amounts as integer cents
// This prevents floating-point precision issues in financial calculations

/**
 * Convert euro amount to cents (integer)
 * @param {number|string} value - Euro amount (can be positive or negative)
 * @returns {number} Amount in cents as integer
 */
export const euroToCents = (value) => {
    if (typeof value === 'string') {
        // Handle string inputs (remove commas, convert to number)
        const cleanValue = value.replace(/,/g, '');
        return Math.round(parseFloat(cleanValue) * 100);
    }
    return Math.round(value * 100);
};

/**
 * Convert cents (integer) to euro string with exactly 2 decimal places
 * @param {number} cents - Amount in cents (can be positive or negative)
 * @returns {string} Euro amount as string with 2 decimal places
 */
export const centsToEuroString = (cents) => {
    return (cents / 100).toFixed(2);
};

/**
 * Format cents as euro string with proper locale formatting
 * @param {number} cents - Amount in cents
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} Formatted euro string
 */
export const formatCentsAsEuro = (cents, locale = 'en-US') => {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(cents / 100);
};

/**
 * Parse various amount formats to cents
 * @param {string|number} amount - Amount in various formats
 * @returns {number} Amount in cents
 */
export const parseAmountToCents = (amount) => {
    if (typeof amount === 'number') {
        return euroToCents(amount);
    }

    if (typeof amount === 'string') {
        // Remove currency symbols, spaces, and normalize decimal separator
        const cleanAmount = amount
            .replace(/[€$£\s]/g, '') // Remove currency symbols and spaces
            .replace(/,/g, '.'); // Convert comma to period for decimal

        return euroToCents(parseFloat(cleanAmount));
    }

    return 0;
};
