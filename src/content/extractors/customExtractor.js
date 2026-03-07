/**
 * Custom selector-based extractor
 * @module customExtractor
 */

import { getTextContent, getAttributeValue, resolveUrl } from '../utils/domUtils.js';
import { querySafeAll, querySafe, isValidSelector } from '../utils/selectorUtils.js';

/**
 * Extracts data using custom selector configurations
 * @param {Document} doc
 * @param {Array<{name: string, cssSelector?: string, xpathSelector?: string, multiple?: boolean, attribute?: string, transform?: string}>} selectors
 * @returns {Array<object>}
 */
export function extract(doc = document, selectors = []) {
  if (selectors.length === 0) return [];

  // Check if any selector is marked as multiple (repeating)
  const hasMultiple = selectors.some(s => s.multiple);

  if (hasMultiple) {
    // Find the first "multiple" selector to get count of records
    const primarySel = selectors.find(s => s.multiple);
    const primaryElements = primarySel ? querySafeAll(primarySel.cssSelector || '', doc) : [];
    const count = primaryElements.length;
    if (count === 0) return [];

    return Array.from({ length: count }, (_, i) => {
      const record = {};
      selectors.forEach(sel => {
        const elements = querySafeAll(sel.cssSelector || '', doc);
        const el = elements[i] || null;
        record[sel.name] = el ? extractValue(el, sel) : null;
      });
      return record;
    });
  }

  // Single record extraction
  const record = {};
  selectors.forEach(sel => {
    record[sel.name] = extractField(doc, sel);
  });
  return [record];
}

/**
 * Extracts a single field from the document
 * @param {Document|Element} doc
 * @param {object} selector
 * @returns {*}
 */
export function extractField(doc, selector) {
  if (selector.xpathSelector) {
    return extractByXPath(doc, selector);
  }
  if (!selector.cssSelector) return null;

  if (selector.multiple) {
    const elements = querySafeAll(selector.cssSelector, doc);
    return elements.map(el => extractValue(el, selector));
  }
  const el = querySafe(selector.cssSelector, doc);
  return el ? extractValue(el, selector) : null;
}

/**
 * Extracts value from an element based on selector config
 * @param {Element} el
 * @param {object} selector
 * @returns {string|null}
 */
function extractValue(el, selector) {
  let value;
  if (selector.attribute) {
    value = getAttributeValue(el, selector.attribute);
    if (['href', 'src', 'action'].includes(selector.attribute)) {
      value = resolveUrl(value);
    }
  } else if (selector.type === 'link') {
    value = resolveUrl(getAttributeValue(el, 'href') || getTextContent(el));
  } else if (selector.type === 'image') {
    value = resolveUrl(getAttributeValue(el, 'src') || getAttributeValue(el, 'data-src'));
  } else {
    value = getTextContent(el);
  }

  if (value && selector.transform) {
    switch (selector.transform) {
      case 'trim': value = value.trim(); break;
      case 'lowercase': value = value.toLowerCase(); break;
      case 'uppercase': value = value.toUpperCase(); break;
      case 'number': value = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0; break;
    }
  }
  return value;
}

function extractByXPath(doc, selector) {
  try {
    const result = document.evaluate(
      selector.xpathSelector, doc, null,
      selector.multiple ? XPathResult.ORDERED_NODE_SNAPSHOT_TYPE : XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    );
    if (selector.multiple) {
      const items = [];
      for (let i = 0; i < result.snapshotLength; i++) {
        const node = result.snapshotItem(i);
        items.push(node?.textContent?.trim() || null);
      }
      return items;
    }
    return result.singleNodeValue?.textContent?.trim() || null;
  } catch {
    return null;
  }
}
