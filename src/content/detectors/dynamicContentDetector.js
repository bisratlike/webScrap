/**
 * SPA and dynamic content detector
 * @module dynamicContentDetector
 */

import { delay } from '../utils/waitUtils.js';

/**
 * Detects if the page uses dynamic/SPA content loading
 * @param {Document} doc
 * @returns {{isSPA: boolean, framework: string|null, hasLazyLoad: boolean}}
 */
export function detectDynamicContent(doc = document) {
  return {
    isSPA: detectSPA(doc),
    framework: detectFramework(),
    hasLazyLoad: detectLazyLoad(doc),
    hasInfiniteScroll: detectInfiniteScroll(doc),
  };
}

/**
 * Waits for an element to appear via dynamic loading
 * @param {string} selector
 * @param {number} [timeout=10000]
 * @returns {Promise<Element|null>}
 */
export function waitForContent(selector, timeout = 10000) {
  return new Promise(resolve => {
    const existing = document.querySelector(selector);
    if (existing) { resolve(existing); return; }

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) { observer.disconnect(); resolve(el); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(null); }, timeout);
  });
}

/**
 * Observes DOM mutations and calls callback on changes
 * @param {Function} callback
 * @returns {{ stop: Function }}
 */
export function observeMutations(callback) {
  const observer = new MutationObserver(mutations => {
    callback(mutations);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: false });
  return { stop: () => observer.disconnect() };
}

/**
 * Checks if content has loaded for a selector
 * @param {string} selector
 * @returns {boolean}
 */
export function isContentLoaded(selector) {
  const el = document.querySelector(selector);
  return !!el && el.children.length > 0;
}

function detectSPA() {
  return !!(
    window.__NEXT_DATA__ || window.__NUXT__ || window.__vue_app__ ||
    document.getElementById('root')?.dataset?.reactroot !== undefined ||
    window.angular || window.ng
  );
}

function detectFramework() {
  if (window.__NEXT_DATA__) return 'Next.js';
  if (window.__NUXT__) return 'Nuxt.js';
  if (window.__vue_app__ || document.querySelector('[data-v-]')) return 'Vue';
  if (document.querySelector('[data-reactroot], [data-reactid]')) return 'React';
  if (window.angular || window.ng) return 'Angular';
  return null;
}

function detectLazyLoad(doc) {
  return !!(doc.querySelector('[loading="lazy"], [data-src], [data-lazy]'));
}

function detectInfiniteScroll(doc) {
  const body = doc.body.textContent.toLowerCase();
  return body.includes('infinite') || !!(doc.querySelector('[class*="infinite"], [class*="load-more"]'));
}
