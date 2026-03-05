/**
 * Request validator middleware
 * @module validator
 */

import { MESSAGES } from '../../shared/constants/messages.js';

const KNOWN_TYPES = new Set(Object.values(MESSAGES));

/**
 * Validates an incoming chrome runtime message
 * @param {*} message
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRequest(message) {
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Message must be an object' };
  }
  if (!message.type) {
    return { valid: false, error: 'Message must have a type field' };
  }
  if (!KNOWN_TYPES.has(message.type)) {
    return { valid: false, error: `Unknown message type: ${message.type}` };
  }
  return { valid: true };
}

/**
 * Checks that all required fields exist on an object
 * @param {object} obj
 * @param {string[]} fields
 * @returns {{ valid: boolean, missing: string[] }}
 */
export function requireFields(obj, fields) {
  const missing = fields.filter(f => obj[f] === undefined || obj[f] === null);
  return { valid: missing.length === 0, missing };
}

/**
 * Validates field types on an object against a schema
 * @param {object} obj
 * @param {object} schema - Map of field name to expected type string
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateTypes(obj, schema) {
  const errors = [];
  for (const [field, expectedType] of Object.entries(schema)) {
    if (obj[field] !== undefined && typeof obj[field] !== expectedType) {
      errors.push(`Field "${field}" expected ${expectedType}, got ${typeof obj[field]}`);
    }
  }
  return { valid: errors.length === 0, errors };
}
