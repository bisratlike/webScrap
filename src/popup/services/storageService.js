/**
 * Local storage service for popup
 * @module popup/storageService
 */

const hasStorage = typeof chrome !== 'undefined' && chrome.storage;

/**
 * Gets an item from chrome.storage.local
 * @param {string} key
 * @returns {Promise<*>}
 */
export async function getItem(key) {
  if (!hasStorage) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, result => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result[key] ?? null);
    });
  });
}

/**
 * Sets an item in chrome.storage.local
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export async function setItem(key, value) {
  if (!hasStorage) {
    localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [key]: value }, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

/**
 * Removes an item from chrome.storage.local
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function removeItem(key) {
  if (!hasStorage) {
    localStorage.removeItem(key);
    return;
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(key, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}
