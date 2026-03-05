/**
 * DOM utility functions for content scripts
 * @module domUtils
 */

/**
 * Gets clean text content from an element
 * @param {Element} element
 * @returns {string}
 */
export function getTextContent(element) {
  if (!element) return '';
  return (element.textContent || element.innerText || '').replace(/\s+/g, ' ').trim();
}

/**
 * Safely gets an attribute value from an element
 * @param {Element} element
 * @param {string} attr
 * @returns {string|null}
 */
export function getAttributeValue(element, attr) {
  if (!element || !attr) return null;
  return element.getAttribute(attr) || null;
}

/**
 * Safely finds elements using a CSS selector
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element[]}
 */
export function findElements(selector, root = document) {
  try {
    return Array.from(root.querySelectorAll(selector));
  } catch {
    return [];
  }
}

/**
 * Finds the closest parent matching a selector
 * @param {Element} element
 * @param {string} selector
 * @returns {Element|null}
 */
export function closestParent(element, selector) {
  if (!element || !selector) return null;
  try {
    return element.closest(selector);
  } catch {
    return null;
  }
}

/**
 * Checks if an element is visible in the viewport
 * @param {Element} element
 * @returns {boolean}
 */
export function isVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * Gets the absolute URL from a possibly relative URL
 * @param {string} url
 * @returns {string}
 */
export function resolveUrl(url) {
  if (!url) return '';
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}
