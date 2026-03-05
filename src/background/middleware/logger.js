/**
 * Debug logging middleware
 * @module logger (middleware)
 */

import { logDebug, logInfo, logError } from '../../shared/utils/logging.js';

let debugMode = false;

/**
 * Sets the debug mode
 * @param {boolean} enabled
 */
export function setDebugMode(enabled) {
  debugMode = !!enabled;
}

/**
 * Logs an incoming request
 * @param {object} message
 * @param {chrome.runtime.MessageSender} sender
 */
export function logRequest(message, sender) {
  if (!debugMode) return;
  logDebug('[MW] Incoming request', {
    type: message?.type,
    from: sender?.tab ? `tab:${sender.tab.id}` : 'popup',
    payload: message?.payload,
  });
}

/**
 * Logs an outgoing response
 * @param {object} response
 * @param {number} durationMs
 */
export function logResponse(response, durationMs) {
  if (!debugMode) return;
  logDebug('[MW] Response sent', {
    success: response?.success,
    duration: `${durationMs}ms`,
  });
}

/**
 * Logs an error with context
 * @param {Error} error
 * @param {string} context
 */
export function logMiddlewareError(error, context) {
  logError(`[MW] Error in ${context}`, error);
}
