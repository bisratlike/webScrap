/**
 * Message formatting utilities
 * @module messageFormatter
 */

import { generateId } from './idGenerator.js';

/**
 * Creates a standardized request message
 * @param {string} type - Message type from MESSAGES constants
 * @param {object} [payload={}]
 * @returns {object}
 */
export function createRequest(type, payload = {}) {
  return {
    id: generateId(),
    type,
    payload,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a standardized response message
 * @param {boolean} success
 * @param {*} [data=null]
 * @param {string|Error} [error=null]
 * @returns {object}
 */
export function createResponse(success, data = null, error = null) {
  return {
    success,
    data,
    error: error instanceof Error ? error.message : error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates a progress update message
 * @param {number} current
 * @param {number} total
 * @param {string} [message='']
 * @returns {object}
 */
export function createProgressUpdate(current, total, message = '') {
  return {
    type: 'PROGRESS_UPDATE',
    current,
    total,
    percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parses and validates an incoming message
 * @param {*} message
 * @returns {{ valid: boolean, type: string, payload: object, error?: string }}
 */
export function parseMessage(message) {
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Message must be an object' };
  }
  if (!message.type || typeof message.type !== 'string') {
    return { valid: false, error: 'Message must have a type string' };
  }
  return {
    valid: true,
    type: message.type,
    payload: message.payload || {},
    id: message.id,
  };
}
