/**
 * Data validation utilities
 * @module validation
 */

import { CONFIG } from '../constants/config.js';

/**
 * Validates a URL string
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validates a CSS selector
 * @param {string} selector - CSS selector to validate
 * @returns {boolean} True if valid selector
 */
export function isValidSelector(selector) {
  if (!selector || typeof selector !== 'string') return false;
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a value is a non-empty string
 * @param {*} str - Value to check
 * @returns {boolean}
 */
export function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validates export format
 * @param {string} format - Format to validate
 * @returns {boolean}
 */
export function isValidExportFormat(format) {
  return CONFIG.SUPPORTED_EXPORT_FORMATS.includes(format);
}

/**
 * Sanitizes text by removing potentially dangerous characters
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}
