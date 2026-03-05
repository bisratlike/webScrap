/**
 * CSS/XPath selector generation
 * @module selectorGenerator
 */

import { generateSelector, generateXPath } from '../detectors/selectorDetector.js';
import { escapeSelector, querySafeAll } from '../utils/selectorUtils.js';

/**
 * Gets a CSS selector for an element
 * @param {Element} element
 * @returns {string}
 */
export function getCssSelector(element) {
  return generateSelector(element);
}

/**
 * Gets an XPath expression for an element
 * @param {Element} element
 * @returns {string}
 */
export function getXPath(element) {
  return generateXPath(element);
}

/**
 * Gets the most unique, minimal selector for an element
 * @param {Element} element
 * @returns {{css: string, xpath: string, unique: boolean}}
 */
export function getUniqueSelector(element) {
  const css = getCssSelector(element);
  const xpath = getXPath(element);
  const matches = querySafeAll(css);
  return {
    css,
    xpath,
    unique: matches.length === 1,
    matchCount: matches.length,
  };
}

/**
 * Scores a CSS selector based on quality (lower is better)
 * @param {string} selector
 * @returns {number}
 */
export function getSelectorScore(selector) {
  if (!selector) return Infinity;
  let score = 0;
  score += (selector.match(/nth-child/g) || []).length * 10; // nth-child is fragile
  score += selector.split('>').length * 2; // Depth penalty
  score += selector.length * 0.1; // Length penalty
  if (selector.startsWith('#')) score -= 50; // ID selectors are great
  if (selector.includes('[class')) score += 5; // Attribute selectors are ok
  return score;
}
