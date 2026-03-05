/**
 * Global error handler middleware
 * @module errorHandler
 */

import { logError } from '../../shared/utils/logging.js';
import { ERRORS } from '../../shared/constants/errors.js';

/** Error type constants */
export const ErrorTypes = {
  ...ERRORS,
};

/**
 * Handles and logs an error, returning a standardized error info object
 * @param {Error} error
 * @param {string} [context='']
 * @returns {object}
 */
export function handleError(error, context = '') {
  logError(`Error in ${context || 'unknown context'}`, error);
  return {
    type: error.type || ERRORS.UNKNOWN_ERROR,
    message: error.message || 'An unexpected error occurred',
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized error response
 * @param {Error|object} error
 * @returns {object}
 */
export function createErrorResponse(error) {
  return {
    success: false,
    data: null,
    error: {
      type: error.type || ERRORS.UNKNOWN_ERROR,
      message: error.message || String(error),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Checks if an error is recoverable (can be retried)
 * @param {Error} error
 * @returns {boolean}
 */
export function isRecoverableError(error) {
  const recoverableTypes = [
    ERRORS.NETWORK_ERROR,
    ERRORS.TIMEOUT_ERROR,
    ERRORS.RATE_LIMIT_ERROR,
  ];
  return recoverableTypes.includes(error.type);
}
