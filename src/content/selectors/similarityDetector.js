/**
 * Similar element detection
 * @module similarityDetector
 */

import { escapeSelector, querySafeAll } from '../utils/selectorUtils.js';

/**
 * Finds elements similar to the given element
 * @param {Element} element
 * @returns {Element[]}
 */
export function findSimilarElements(element) {
  if (!element) return [];
  const siblings = getSiblings(element);
  if (siblings.length > 1) return siblings;

  // Try finding by tag + class combo
  const selector = getCommonPatternSelector(element);
  return selector ? querySafeAll(selector) : [];
}

/**
 * Calculates a similarity score between two elements (0-1)
 * @param {Element} el1
 * @param {Element} el2
 * @returns {number}
 */
export function calculateSimilarity(el1, el2) {
  if (!el1 || !el2) return 0;
  let score = 0;
  if (el1.tagName === el2.tagName) score += 0.4;
  const classes1 = new Set(el1.classList);
  const classes2 = new Set(el2.classList);
  const union = new Set([...classes1, ...classes2]);
  const intersection = new Set([...classes1].filter(c => classes2.has(c)));
  if (union.size > 0) score += 0.4 * (intersection.size / union.size);
  const children1 = el1.children.length;
  const children2 = el2.children.length;
  const maxChildren = Math.max(children1, children2);
  if (maxChildren > 0) score += 0.2 * (1 - Math.abs(children1 - children2) / maxChildren);
  return Math.min(1, score);
}

/**
 * Gets sibling elements of the same type
 * @param {Element} element
 * @returns {Element[]}
 */
export function getSiblings(element) {
  const parent = element.parentElement;
  if (!parent) return [element];
  return Array.from(parent.children).filter(
    child => child.tagName === element.tagName
  );
}

/**
 * Gets a common CSS selector for multiple similar elements
 * @param {Element[]} elements
 * @returns {string|null}
 */
export function getCommonSelector(elements) {
  if (!elements || elements.length === 0) return null;
  if (elements.length === 1) return getCommonPatternSelector(elements[0]);

  // Find common classes
  const firstClasses = new Set(elements[0].classList);
  const commonClasses = elements.reduce((common, el) => {
    return new Set([...common].filter(c => el.classList.contains(c)));
  }, firstClasses);

  const tag = elements[0].tagName.toLowerCase();
  if (commonClasses.size > 0) {
    return `${tag}.${Array.from(commonClasses).map(escapeSelector).join('.')}`;
  }
  return tag;
}

function getCommonPatternSelector(element) {
  const tag = element.tagName.toLowerCase();
  const classes = Array.from(element.classList)
    .filter(c => !c.match(/^(active|selected|hover|focus|js-)/))
    .slice(0, 2);
  if (classes.length > 0) return `${tag}.${classes.map(escapeSelector).join('.')}`;
  return tag;
}
