/**
 * DataSnap Pro - Background Service Worker
 * Express-style router for Chrome extension messages
 * @module background/app
 */

import { MESSAGES } from '../shared/constants/messages.js';
import { logInfo, logError } from '../shared/utils/logging.js';

// Middleware
import { validateRequest } from './middleware/validator.js';
import { logRequest, logResponse } from './middleware/logger.js';
import { checkRateLimit, recordRequest } from './middleware/rateLimiter.js';
import { createErrorResponse, handleError } from './middleware/errorHandler.js';

// Controllers
import { startScraping, stopScraping, getStatus, handleScrapingResult } from './controllers/scraperController.js';
import { exportData, previewExport } from './controllers/exportController.js';
import { createSessionHandler, loadSession, updateSessionHandler, deleteSessionHandler, listSessions } from './controllers/sessionController.js';
import { getSettingsHandler, updateSettings, resetSettings } from './controllers/settingsController.js';

/** Route map: message type → handler function */
const routes = {
  [MESSAGES.SCRAPE_START]:    startScraping,
  [MESSAGES.SCRAPE_STOP]:     stopScraping,
  [MESSAGES.SCRAPE_COMPLETE]: handleScrapingResult,
  [MESSAGES.EXPORT_DATA]:     exportData,
  [MESSAGES.EXPORT_PREVIEW]:  previewExport,
  [MESSAGES.SESSION_CREATE]:  createSessionHandler,
  [MESSAGES.SESSION_LOAD]:    loadSession,
  [MESSAGES.SESSION_UPDATE]:  updateSessionHandler,
  [MESSAGES.SESSION_DELETE]:  deleteSessionHandler,
  [MESSAGES.SESSION_LIST]:    listSessions,
  [MESSAGES.SETTINGS_GET]:    getSettingsHandler,
  [MESSAGES.SETTINGS_SET]:    updateSettings,
  [MESSAGES.SETTINGS_RESET]:  resetSettings,
};

/**
 * Main message router - handles all incoming chrome.runtime messages
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const startTime = Date.now();

  // Log request
  logRequest(message, sender);

  // Validate message structure
  const validation = validateRequest(message);
  if (!validation.valid) {
    logError('Invalid message received', validation.error);
    sendResponse({ success: false, error: validation.error });
    return true;
  }

  // Rate limiting by sender tab or 'popup'
  const rateLimitKey = sender.tab ? `tab:${sender.tab.id}` : 'popup';
  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    sendResponse({ success: false, error: `Rate limited. Retry after ${rateCheck.retryAfter}ms` });
    return true;
  }
  recordRequest(rateLimitKey);

  // Route to handler
  const handler = routes[message.type];
  if (!handler) {
    logError('Unknown message type', message.type);
    sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
    return true;
  }

  // Execute handler asynchronously
  Promise.resolve()
    .then(() => new Promise(resolve => {
      handler(message, response => {
        logResponse(response, Date.now() - startTime);
        resolve(response);
      });
    }))
    .then(response => sendResponse(response))
    .catch(err => {
      const errorInfo = handleError(err, message.type);
      sendResponse(createErrorResponse(err));
    });

  return true; // Keep message channel open for async response
});

logInfo('DataSnap Pro background service worker initialized');
