/**
 * Background communication service for popup
 * @module popup/apiService
 */

import { MESSAGES } from '../../shared/constants/messages.js';

/**
 * Sends a message to the background service worker
 * @param {string} type - Message type
 * @param {object} [payload={}]
 * @returns {Promise<object>}
 */
export function sendToBackground(type, payload = {}) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      reject(new Error('Chrome runtime not available'));
      return;
    }
    chrome.runtime.sendMessage({ type, payload }, response => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Triggers scraping on the current tab
 * @param {Array<object>} selectors
 * @param {string} [sessionId]
 * @param {string} [extractType='custom']
 * @returns {Promise<{jobId: string, sessionId: string}>}
 */
export async function scrapeCurrentTab(selectors, sessionId, extractType = 'custom') {
  const response = await sendToBackground(MESSAGES.SCRAPE_START, { selectors, sessionId, extractType });
  if (!response?.success) throw new Error(response?.error || 'Scrape failed to start');
  return response.data;
}

/**
 * Exports data from a session
 * @param {string} format - 'csv', 'json', 'excel'
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export async function exportData(format, sessionId) {
  const response = await sendToBackground(MESSAGES.EXPORT_DATA, { format, sessionId });
  if (!response?.success) throw new Error(response?.error || 'Export failed');
  return response.data;
}

/**
 * Gets session data from background storage
 * @param {string} sessionId
 * @returns {Promise<object>}
 */
export async function getSessionData(sessionId) {
  const response = await sendToBackground(MESSAGES.SESSION_LOAD, { sessionId });
  if (!response?.success) throw new Error(response?.error || 'Session not found');
  return response.data;
}

/**
 * Lists all sessions
 * @returns {Promise<Array<object>>}
 */
export async function listSessions() {
  const response = await sendToBackground(MESSAGES.SESSION_LIST, {});
  if (!response?.success) throw new Error(response?.error || 'Failed to list sessions');
  return response.data || [];
}
