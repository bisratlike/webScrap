/**
 * Wait and timing utility functions
 * @module waitUtils
 */

/**
 * Waits for an element matching selector to appear in the DOM
 * @param {string} selector
 * @param {number} [timeout=10000]
 * @returns {Promise<Element>}
 */
export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector);
    if (existing) { resolve(existing); return; }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for element: ${selector}`));
    }, timeout);
  });
}

/**
 * Waits for a condition function to return true
 * @param {Function} conditionFn
 * @param {number} [timeout=10000]
 * @param {number} [interval=200]
 * @returns {Promise<void>}
 */
export function waitForCondition(conditionFn, timeout = 10000, interval = 200) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (conditionFn()) { resolve(); return; }
      if (Date.now() - start >= timeout) {
        reject(new Error('Condition timeout'));
        return;
      }
      setTimeout(check, interval);
    };
    check();
  });
}

/**
 * Returns a promise that resolves after a delay
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a debounced version of a function
 * @param {Function} fn
 * @param {number} delayMs
 * @returns {Function}
 */
export function debounce(fn, delayMs) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delayMs);
  };
}
