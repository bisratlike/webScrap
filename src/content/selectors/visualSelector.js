/**
 * Visual element selection mode
 * @module visualSelector
 */

import { highlightElement, clearHighlight, clearAllHighlights } from './highlighter.js';
import { getUniqueSelector } from './selectorGenerator.js';
import { findSimilarElements } from './similarityDetector.js';
import { getTextContent } from '../utils/domUtils.js';

let isSelecting = false;
let hoveredElement = null;
let onSelectCallback = null;
let tooltip = null;

const TOOLTIP_STYLES = [
  'position: fixed',
  'z-index: 2147483647',
  'background: #1e293b',
  'color: #f1f5f9',
  'padding: 6px 10px',
  'border-radius: 6px',
  'font-size: 12px',
  'font-family: monospace',
  'pointer-events: none',
  'max-width: 300px',
  'word-break: break-all',
  'box-shadow: 0 4px 12px rgba(0,0,0,0.3)',
  'border: 1px solid #334155',
].join('; ');

/**
 * Starts visual selection mode
 * @param {Function} callback - Called with selected element info
 */
export function startSelection(callback) {
  if (isSelecting) return;
  isSelecting = true;
  onSelectCallback = callback;
  createTooltip();
  document.addEventListener('mouseover', handleMouseover, true);
  document.addEventListener('click', handleClick, true);
  document.body.style.cursor = 'crosshair';
}

/**
 * Stops visual selection mode
 */
export function stopSelection() {
  if (!isSelecting) return;
  isSelecting = false;
  onSelectCallback = null;
  document.removeEventListener('mouseover', handleMouseover, true);
  document.removeEventListener('click', handleClick, true);
  document.body.style.cursor = '';
  clearAllHighlights();
  removeTooltip();
}

/**
 * Handles mouseover events during selection mode
 * @param {MouseEvent} event
 */
export function handleMouseover(event) {
  if (!isSelecting) return;
  const el = event.target;
  if (el === tooltip || tooltip?.contains(el)) return;
  if (hoveredElement) clearHighlight(hoveredElement);
  hoveredElement = el;
  highlightElement(el);
  updateTooltip(el, event);
}

/**
 * Handles click events during selection mode
 * @param {MouseEvent} event
 */
export function handleClick(event) {
  if (!isSelecting) return;
  event.preventDefault();
  event.stopPropagation();
  const el = event.target;
  if (el === tooltip || tooltip?.contains(el)) return;

  const selectorInfo = getUniqueSelector(el);
  const similar = findSimilarElements(el);

  if (onSelectCallback) {
    onSelectCallback({
      element: el,
      selector: selectorInfo.css,
      xpath: selectorInfo.xpath,
      text: getTextContent(el),
      tagName: el.tagName.toLowerCase(),
      similarCount: similar.length,
      unique: selectorInfo.unique,
    });
  }
  stopSelection();
}

function createTooltip() {
  tooltip = document.createElement('div');
  tooltip.id = 'datasnap-tooltip';
  tooltip.style.cssText = TOOLTIP_STYLES;
  document.body.appendChild(tooltip);
}

function removeTooltip() {
  if (tooltip) { tooltip.remove(); tooltip = null; }
}

function updateTooltip(el, event) {
  if (!tooltip) return;
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls = Array.from(el.classList).slice(0, 2).map(c => `.${c}`).join('');
  tooltip.textContent = `${tag}${id}${cls}`;
  const x = Math.min(event.clientX + 12, window.innerWidth - 320);
  const y = Math.min(event.clientY + 12, window.innerHeight - 60);
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}
