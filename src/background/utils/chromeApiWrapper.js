/**
 * Chrome API wrapper utilities
 * @module chromeApiWrapper
 */

const hasChromeApi = typeof chrome !== 'undefined' && chrome.runtime;

/**
 * Sends a message to a content script in a tab
 * @param {number} tabId
 * @param {object} message
 * @returns {Promise<*>}
 */
export async function sendMessageToTab(tabId, message) {
  if (!hasChromeApi) throw new Error('Chrome API not available');
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Gets the currently active tab
 * @returns {Promise<chrome.tabs.Tab>}
 */
export async function getCurrentTab() {
  if (!hasChromeApi) throw new Error('Chrome API not available');
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (!tabs || tabs.length === 0) {
        reject(new Error('No active tab found'));
      } else {
        resolve(tabs[0]);
      }
    });
  });
}

/**
 * Executes a function in a tab's context
 * @param {number} tabId
 * @param {Function} func
 * @param {Array} [args=[]]
 * @returns {Promise<*>}
 */
export async function executeScript(tabId, func, args = []) {
  if (!hasChromeApi) throw new Error('Chrome API not available');
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func,
    args,
  });
  return results?.[0]?.result;
}

/**
 * Creates a download via chrome.downloads API
 * @param {object} options - chrome.downloads.DownloadOptions
 * @returns {Promise<number>} Download ID
 */
export async function createDownload(options) {
  if (!hasChromeApi) throw new Error('Chrome API not available');
  return new Promise((resolve, reject) => {
    chrome.downloads.download(options, downloadId => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(downloadId);
      }
    });
  });
}
