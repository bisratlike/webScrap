/**
 * Automatic CSS/XPath selector generator
 * @module selectorDetector
 */

import { querySafeAll, escapeSelector, isValidSelector } from '../utils/selectorUtils.js';

/**
 * Generates a unique CSS selector for an element
 * @param {Element} element
 * @returns {string}
 */
export function generateSelector(element) {
  if (!element) return '';
  if (element.id) return `#${escapeSelector(element.id)}`;
  return buildSelector(element);
}

/**
 * Generates an XPath expression for an element
 * @param {Element} element
 * @returns {string}
 */
export function generateXPath(element) {
  if (!element) return '';
  if (element.id) return `//*[@id="${element.id}"]`;

  const parts = [];
  let current = element;
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (!parent) { parts.unshift(tag); break; }
    const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
    const index = siblings.indexOf(current) + 1;
    parts.unshift(siblings.length > 1 ? `${tag}[${index}]` : tag);
    current = parent;
  }
  return '/' + parts.join('/');
}

/**
 * Creates a minimal unique CSS selector
 * @param {string} selector
 * @returns {string}
 */
export function simplifySelector(selector) {
  if (!isValidSelector(selector)) return selector;
  // Try to find shorter equivalent
  const parts = selector.split('>').map(p => p.trim());
  for (let i = parts.length - 1; i >= 0; i--) {
    const simplified = parts.slice(i).join(' > ');
    try {
      const matches = document.querySelectorAll(simplified);
      if (matches.length === 1) return simplified;
    } catch (_e) { /* invalid selector — skip */ }
  }
  return selector;
}

/**
 * Tests that a selector returns at least one element
 * @param {string} selector
 * @returns {boolean}
 */
export function testSelector(selector) {
  if (!isValidSelector(selector)) return false;
  return document.querySelectorAll(selector).length > 0;
}

function buildSelector(element) {
  const parts = [];
  let current = element;

  while (current && current !== document.body && current !== document.documentElement) {
    let part = current.tagName.toLowerCase();

    // Add meaningful class if present
    const classes = Array.from(current.classList)
      .filter(c => !c.match(/^(js-|is-|has-)/))
      .slice(0, 2);
    if (classes.length > 0) {
      part += '.' + classes.map(escapeSelector).join('.');
    }

    // Check if this selector is unique so far
    const tentativeSelector = [part, ...parts].join(' > ');
    try {
      if (document.querySelectorAll(tentativeSelector).length === 1) {
        return tentativeSelector;
      }
    } catch (_e) { /* invalid selector — continue building */ }

    // Add nth-child for disambiguation
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
      if (siblings.length > 1) {
        part += `:nth-child(${Array.from(parent.children).indexOf(current) + 1})`;
      }
    }

    parts.unshift(part);
    current = current.parentElement;
  }

  return parts.join(' > ');
}
