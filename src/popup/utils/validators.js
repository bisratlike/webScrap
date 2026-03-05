/**
 * Frontend validators
 * @module popup/validators
 */

/**
 * Validates a CSS selector
 * @param {string} selector
 * @returns {boolean}
 */
export function isValidCssSelector(selector) {
  if (!selector || typeof selector !== 'string') return false;
  try {
    document.createDocumentFragment().querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates a URL
 * @param {string} url
 * @returns {boolean}
 */
export function isValidUrl(url) {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a value is non-empty
 * @param {*} value
 * @returns {boolean}
 */
export function isNonEmpty(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
