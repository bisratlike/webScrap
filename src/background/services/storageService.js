/**
 * Chrome storage service
 * @module storageService
 */

import { CONFIG } from '../../shared/constants/config.js';
import { logError, logDebug } from '../../shared/utils/logging.js';
import { ERRORS } from '../../shared/constants/errors.js';

const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage;

/**
 * Helper to promisify chrome.storage operations
 * @param {Function} operation
 * @returns {Promise<*>}
 */
function promisifyStorage(operation) {
  if (!hasChromeStorage) {
    return Promise.reject(new Error('Chrome storage API not available'));
  }
  return new Promise((resolve, reject) => {
    operation(result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

const SESSIONS_KEY = `${CONFIG.STORAGE_KEY_PREFIX}sessions`;
const SETTINGS_KEY = `${CONFIG.STORAGE_KEY_PREFIX}settings`;

/**
 * Saves a session to chrome.storage.local
 * @param {object} session - Session object (serialized via toJSON())
 * @returns {Promise<void>}
 */
export async function saveSession(session) {
  try {
    const all = await getAllSessions();
    all[session.id] = session;
    await promisifyStorage(cb => chrome.storage.local.set({ [SESSIONS_KEY]: all }, cb));
    logDebug('Session saved', session.id);
  } catch (err) {
    logError('Failed to save session', err);
    throw Object.assign(err, { type: ERRORS.STORAGE_ERROR });
  }
}

/**
 * Retrieves a session by ID
 * @param {string} sessionId
 * @returns {Promise<object|null>}
 */
export async function getSession(sessionId) {
  try {
    const all = await getAllSessions();
    return all[sessionId] || null;
  } catch (err) {
    logError('Failed to get session', err);
    throw Object.assign(err, { type: ERRORS.STORAGE_ERROR });
  }
}

/**
 * Gets all sessions as a map keyed by session ID
 * @returns {Promise<object>}
 */
export async function getAllSessions() {
  try {
    const result = await promisifyStorage(cb => chrome.storage.local.get(SESSIONS_KEY, cb));
    return result[SESSIONS_KEY] || {};
  } catch (err) {
    logError('Failed to get all sessions', err);
    return {};
  }
}

/**
 * Deletes a session by ID
 * @param {string} sessionId
 * @returns {Promise<void>}
 */
export async function deleteSession(sessionId) {
  try {
    const all = await getAllSessions();
    delete all[sessionId];
    await promisifyStorage(cb => chrome.storage.local.set({ [SESSIONS_KEY]: all }, cb));
    logDebug('Session deleted', sessionId);
  } catch (err) {
    logError('Failed to delete session', err);
    throw Object.assign(err, { type: ERRORS.STORAGE_ERROR });
  }
}

const DEFAULT_SETTINGS = {
  theme: 'light',
  autoSave: true,
  showNotifications: true,
  defaultExportFormat: 'csv',
  maxRetries: CONFIG.MAX_RETRIES,
  requestDelay: 1000,
  debugMode: false,
};

/**
 * Saves extension settings
 * @param {object} settings
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    await promisifyStorage(cb => chrome.storage.local.set({ [SETTINGS_KEY]: merged }, cb));
    logDebug('Settings saved');
  } catch (err) {
    logError('Failed to save settings', err);
    throw Object.assign(err, { type: ERRORS.STORAGE_ERROR });
  }
}

/**
 * Loads settings with defaults applied
 * @returns {Promise<object>}
 */
export async function getSettings() {
  try {
    const result = await promisifyStorage(cb => chrome.storage.local.get(SETTINGS_KEY, cb));
    return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
  } catch (err) {
    logError('Failed to get settings', err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Clears all DataSnap Pro storage
 * @returns {Promise<void>}
 */
export async function clearAll() {
  try {
    await promisifyStorage(cb => chrome.storage.local.remove([SESSIONS_KEY, SETTINGS_KEY], cb));
    logDebug('All storage cleared');
  } catch (err) {
    logError('Failed to clear storage', err);
    throw Object.assign(err, { type: ERRORS.STORAGE_ERROR });
  }
}
