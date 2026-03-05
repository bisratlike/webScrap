/**
 * Infinite scroll handler
 * @module scrollHandler
 */

import { delay, waitForCondition } from '../utils/waitUtils.js';

let scrollEnabled = false;
let scrollObserver = null;

/**
 * Enables infinite scroll detection
 * @param {string} itemSelector - Selector for items to monitor
 * @param {Function} callback - Called when new items are loaded
 */
export function enableInfiniteScroll(itemSelector, callback) {
  scrollEnabled = true;
  const initialCount = document.querySelectorAll(itemSelector).length;
  let lastCount = initialCount;

  scrollObserver = new MutationObserver(() => {
    const currentCount = document.querySelectorAll(itemSelector).length;
    if (currentCount > lastCount) {
      const newItems = Array.from(document.querySelectorAll(itemSelector)).slice(lastCount);
      lastCount = currentCount;
      callback(newItems);
    }
  });
  scrollObserver.observe(document.body, { childList: true, subtree: true });
}

/**
 * Disables infinite scroll detection
 */
export function disableInfiniteScroll() {
  scrollEnabled = false;
  if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
}

/**
 * Scrolls to the bottom of the page
 * @param {number} [delayMs=500] - Delay after scrolling
 * @returns {Promise<void>}
 */
export async function scrollToBottom(delayMs = 500) {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  await delay(delayMs);
}

/**
 * Waits for new content to appear after a selector count increases
 * @param {string} selector
 * @param {number} [timeout=5000]
 * @returns {Promise<Element[]>}
 */
export async function waitForNewContent(selector, timeout = 5000) {
  const initialCount = document.querySelectorAll(selector).length;
  try {
    await waitForCondition(
      () => document.querySelectorAll(selector).length > initialCount,
      timeout
    );
  } catch {
    return [];
  }
  return Array.from(document.querySelectorAll(selector)).slice(initialCount);
}
