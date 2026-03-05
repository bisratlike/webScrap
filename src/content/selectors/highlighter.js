/**
 * Element highlighting for visual selection
 * @module highlighter
 */

const HIGHLIGHT_CLASS = 'datasnap-highlight';
const SIMILAR_CLASS = 'datasnap-similar';
const STYLE_ID = 'datasnap-highlight-styles';

let styleInjected = false;

function injectStyles() {
  if (styleInjected || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${HIGHLIGHT_CLASS} { outline: 3px solid #3b82f6 !important; outline-offset: 2px !important; cursor: crosshair !important; }
    .${SIMILAR_CLASS} { outline: 2px dashed #10b981 !important; outline-offset: 1px !important; }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

/**
 * Highlights a single element
 * @param {Element} element
 */
export function highlightElement(element) {
  injectStyles();
  if (element) element.classList.add(HIGHLIGHT_CLASS);
}

/**
 * Removes highlight from an element
 * @param {Element} element
 */
export function clearHighlight(element) {
  if (element) element.classList.remove(HIGHLIGHT_CLASS);
}

/**
 * Highlights all elements matching a selector
 * @param {string} selector
 * @returns {number} Count of highlighted elements
 */
export function highlightSimilar(selector) {
  injectStyles();
  try {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => el.classList.add(SIMILAR_CLASS));
    return elements.length;
  } catch {
    return 0;
  }
}

/**
 * Clears all highlights
 */
export function clearAllHighlights() {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}, .${SIMILAR_CLASS}`).forEach(el => {
    el.classList.remove(HIGHLIGHT_CLASS, SIMILAR_CLASS);
  });
}
