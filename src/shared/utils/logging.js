/**
 * Logging utility for DataSnap Pro
 * @module logging
 */

const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const CURRENT_LEVEL =
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'production'
    ? LOG_LEVELS.WARN
    : LOG_LEVELS.DEBUG;
const PREFIX = '[DataSnap Pro]';

/**
 * General log function
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {string} message
 * @param {*} [data]
 */
export function log(level, message, data) {
  const levelUpper = level.toUpperCase();
  const numLevel = LOG_LEVELS[levelUpper] ?? LOG_LEVELS.INFO;
  if (numLevel < CURRENT_LEVEL) return;
  const timestamp = new Date().toISOString();
  const formatted = `${PREFIX} [${timestamp}] [${levelUpper}] ${message}`;
  switch (level) {
    case 'error':
      data !== undefined ? console.error(formatted, data) : console.error(formatted);
      break;
    case 'warn':
      data !== undefined ? console.warn(formatted, data) : console.warn(formatted);
      break;
    case 'debug':
      data !== undefined ? console.debug(formatted, data) : console.debug(formatted);
      break;
    default:
      data !== undefined ? console.log(formatted, data) : console.log(formatted);
  }
}

/** @param {string} message @param {*} [data] */
export const logInfo = (message, data) => log('info', message, data);
/** @param {string} message @param {*} [data] */
export const logWarn = (message, data) => log('warn', message, data);
/** @param {string} message @param {Error|*} [error] */
export const logError = (message, error) => log('error', message, error);
/** @param {string} message @param {*} [data] */
export const logDebug = (message, data) => log('debug', message, data);
