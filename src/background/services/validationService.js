/**
 * Request and data validation service
 * @module validationService
 */

import { isValidUrl, isValidSelector, isNonEmptyString, isValidExportFormat } from '../../shared/utils/validation.js';
import { CONFIG } from '../../shared/constants/config.js';

/**
 * Validates a scrape request object
 * @param {object} req
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateScrapeRequest(req) {
  const errors = [];
  if (!req || typeof req !== 'object') {
    return { valid: false, errors: ['Request must be an object'] };
  }
  if (!req.payload) {
    return { valid: false, errors: ['Request must have a payload'] };
  }
  const { url, selectors } = req.payload;
  if (url && !isValidUrl(url)) errors.push(`Invalid URL: ${url}`);
  if (!selectors || !Array.isArray(selectors) || selectors.length === 0) {
    errors.push('Selectors must be a non-empty array');
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates an export request
 * @param {object} req
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateExportRequest(req) {
  const errors = [];
  if (!req?.payload) return { valid: false, errors: ['Request must have a payload'] };
  const { format, sessionId } = req.payload;
  if (!isValidExportFormat(format)) errors.push(`Unsupported format: ${format}`);
  if (!isNonEmptyString(sessionId)) errors.push('sessionId is required');
  return { valid: errors.length === 0, errors };
}

/**
 * Validates an array of selector objects
 * @param {Array} selectors
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSelectors(selectors) {
  const errors = [];
  if (!Array.isArray(selectors)) return { valid: false, errors: ['Selectors must be an array'] };
  selectors.forEach((sel, i) => {
    if (!isNonEmptyString(sel.name)) errors.push(`Selector[${i}] missing name`);
    if (!sel.cssSelector && !sel.xpathSelector) {
      errors.push(`Selector[${i}] missing cssSelector or xpathSelector`);
    }
  });
  return { valid: errors.length === 0, errors };
}

/**
 * Validates a session object
 * @param {object} session
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateSession(session) {
  const errors = [];
  if (!session || typeof session !== 'object') return { valid: false, errors: ['Session must be an object'] };
  if (!isNonEmptyString(session.id)) errors.push('Session missing id');
  if (!isNonEmptyString(session.name)) errors.push('Session missing name');
  return { valid: errors.length === 0, errors };
}

/**
 * Sanitizes user input
 * @param {*} input
 * @returns {*} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .slice(0, 10000);
  }
  if (Array.isArray(input)) return input.map(sanitizeInput);
  if (input && typeof input === 'object') {
    return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, sanitizeInput(v)]));
  }
  return input;
}
