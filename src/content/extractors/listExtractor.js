/**
 * List extractor for UL/OL lists
 * @module listExtractor
 */

import { getTextContent } from '../utils/domUtils.js';

/**
 * Extracts all lists from a document
 * @param {Document} doc
 * @returns {Array<{type: string, items: Array}>}
 */
export function extractLists(doc = document) {
  const lists = Array.from(doc.querySelectorAll('ul, ol'));
  // Filter out nav menus and skip nested lists (they'll be handled recursively)
  return lists
    .filter(list => !list.closest('ul, ol'))
    .map(list => extractList(list))
    .filter(l => l.items.length > 0);
}

/**
 * Extracts a single list
 * @param {HTMLElement} listElement
 * @returns {{type: string, items: Array<string|object>}}
 */
export function extractList(listElement) {
  const type = listElement.tagName.toLowerCase();
  const items = Array.from(listElement.children)
    .filter(child => child.tagName === 'LI')
    .map(li => {
      const nestedList = li.querySelector('ul, ol');
      if (nestedList) {
        return {
          text: getTextContent(li.firstChild || li).replace(/\s+/g, ' ').trim(),
          children: extractNestedList(nestedList, 1),
        };
      }
      return getTextContent(li);
    });
  return { type, items };
}

/**
 * Extracts a nested list recursively
 * @param {HTMLElement} listElement
 * @param {number} depth
 * @returns {Array}
 */
export function extractNestedList(listElement, depth = 0) {
  if (depth > 5) return []; // Prevent infinite recursion
  return Array.from(listElement.children)
    .filter(child => child.tagName === 'LI')
    .map(li => {
      const nestedList = li.querySelector('ul, ol');
      if (nestedList) {
        return {
          text: getTextContent(li.firstChild || li),
          children: extractNestedList(nestedList, depth + 1),
          depth,
        };
      }
      return { text: getTextContent(li), depth };
    });
}
