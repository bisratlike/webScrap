/**
 * Settings controller
 * @module settingsController
 */

import { getSettings, saveSettings } from '../services/storageService.js';
import { createResponse } from '../utils/messageFormatter.js';
import { createErrorResponse } from '../middleware/errorHandler.js';
import { logInfo } from '../../shared/utils/logging.js';

/**
 * Gets current extension settings
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function getSettingsHandler(req, sendResponse) {
  try {
    const settings = await getSettings();
    sendResponse(createResponse(true, settings));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Updates extension settings
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function updateSettings(req, sendResponse) {
  try {
    const { settings } = req.payload || {};
    if (!settings || typeof settings !== 'object') {
      sendResponse(createResponse(false, null, 'settings object is required'));
      return;
    }
    const current = await getSettings();
    const merged = { ...current, ...settings };
    await saveSettings(merged);
    logInfo('Settings updated');
    sendResponse(createResponse(true, merged));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Resets settings to defaults
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function resetSettings(req, sendResponse) {
  try {
    await saveSettings({});
    const defaults = await getSettings();
    logInfo('Settings reset to defaults');
    sendResponse(createResponse(true, defaults));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}
