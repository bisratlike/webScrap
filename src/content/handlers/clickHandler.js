/**
 * Click handler for load-more buttons
 * @module clickHandler
 */

import { delay, waitForCondition } from '../utils/waitUtils.js';

const LOAD_MORE_PATTERNS = [
  '[class*="load-more"]', '[class*="loadmore"]', '[id*="load-more"]',
  'button[class*="more"]', 'a[class*="more"]',
  '[data-action="load-more"]', '[aria-label*="more"]',
];

/**
 * Finds a load-more button on the page
 * @param {Document} doc
 * @returns {Element|null}
 */
export function findLoadMoreButton(doc = document) {
  for (const selector of LOAD_MORE_PATTERNS) {
    const el = doc.querySelector(selector);
    if (el && el.offsetParent !== null) return el; // Must be visible
  }
  // Text-based search
  const buttons = doc.querySelectorAll('button, a[href="#"]');
  for (const btn of buttons) {
    const text = (btn.textContent || '').toLowerCase().trim();
    if (text.includes('load more') || text.includes('show more') || text.includes('see more')) {
      return btn;
    }
  }
  return null;
}

/**
 * Clicks a load-more button and waits for new content
 * @param {Element} button
 * @param {string} [contentSelector='*']
 * @returns {Promise<boolean>} True if new content appeared
 */
export async function clickLoadMore(button, contentSelector = '[class*="item"], [class*="card"], li') {
  const countBefore = document.querySelectorAll(contentSelector).length;
  button.click();
  try {
    await waitForCondition(
      () => document.querySelectorAll(contentSelector).length > countBefore,
      5000
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Automatically clicks load-more up to maxClicks times
 * @param {number} [maxClicks=10]
 * @param {Function} [callback] - Called after each click with new content count
 * @returns {Promise<number>} Total clicks performed
 */
export async function autoClickLoadMore(maxClicks = 10, callback) {
  let clicks = 0;
  while (clicks < maxClicks) {
    const button = findLoadMoreButton();
    if (!button) break;
    const success = await clickLoadMore(button);
    if (!success) break;
    clicks++;
    if (callback) callback(clicks);
    await delay(1000);
  }
  return clicks;
}
