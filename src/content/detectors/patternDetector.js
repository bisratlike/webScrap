/**
 * Repeating pattern detector
 * @module patternDetector
 */

import { querySafeAll } from '../utils/selectorUtils.js';

/**
 * Detects repeating patterns in a document
 * @param {Document} doc
 * @returns {Array<{selector: string, count: number, fields: string[]}>}
 */
export function detectPatterns(doc = document) {
  const repeating = findRepeatingElements(doc.body);
  return repeating.map(group => ({
    selector: group.selector,
    count: group.elements.length,
    fields: analyzePattern(group.elements),
    sample: group.elements[0]?.textContent?.slice(0, 100) || '',
  }));
}

/**
 * Finds elements that repeat with similar siblings
 * @param {Element} root
 * @returns {Array<{selector: string, elements: Element[]}>}
 */
export function findRepeatingElements(root) {
  const candidateSelectors = [
    'li', 'tr', 'article', '[class*="item"]', '[class*="card"]',
    '[class*="product"]', '[class*="result"]', '[class*="row"]',
  ];
  const groups = [];

  candidateSelectors.forEach(sel => {
    const elements = Array.from(root.querySelectorAll(sel));
    if (elements.length < 3) return;

    // Group by parent to find truly repeating siblings
    const byParent = new Map();
    elements.forEach(el => {
      const parent = el.parentElement;
      if (!parent) return;
      const key = parent;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key).push(el);
    });

    byParent.forEach((els, parent) => {
      if (els.length >= 3) {
        groups.push({ selector: sel, elements: els, parent });
      }
    });
  });

  // Deduplicate by taking best group per parent
  return groups.filter((group, i, arr) =>
    arr.findIndex(g => g.parent === group.parent) === i
  );
}

/**
 * Analyzes a pattern to find the fields it contains
 * @param {Element[]} elements
 * @returns {string[]} Detected field names
 */
export function analyzePattern(elements) {
  if (!elements || elements.length === 0) return [];
  const first = elements[0];
  const fields = [];

  const fieldPatterns = [
    { selector: 'img', name: 'image' },
    { selector: 'a', name: 'link' },
    { selector: '[class*="price"]', name: 'price' },
    { selector: '[class*="title"], h2, h3', name: 'title' },
    { selector: '[class*="desc"]', name: 'description' },
    { selector: '[class*="rating"]', name: 'rating' },
    { selector: 'time', name: 'date' },
  ];

  fieldPatterns.forEach(({ selector, name }) => {
    if (first.querySelector(selector)) fields.push(name);
  });

  return fields;
}
