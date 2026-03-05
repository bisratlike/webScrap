/**
 * Selector utility functions
 * @module selectorUtils
 */

/**
 * Safely runs querySelectorAll
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element[]}
 */
export function querySafeAll(selector, root = document) {
  if (!selector) return [];
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Safely runs querySelector
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element|null}
 */
export function querySafe(selector, root = document) {
  if (!selector) return null;
  try {
    return root.querySelector(selector);
  } catch {
    return null;
  }
}

/**
 * Validates a CSS selector string
 * @param {string} selector
 * @returns {boolean}
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
 * Escapes special characters in a CSS identifier
 * @param {string} str
 * @returns {string}
 */
export function escapeSelector(str) {
  if (typeof CSS !== 'undefined' && CSS.escape) {
    return CSS.escape(str);
  }
  return str.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}
