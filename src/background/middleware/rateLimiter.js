/**
 * Rate limiting middleware
 * @module rateLimiter
 */

import { CONFIG } from '../../shared/constants/config.js';
import { ERRORS } from '../../shared/constants/errors.js';

/** @type {Map<string, {count: number, windowStart: number}>} */
const rateLimitMap = new Map();

const MAX_REQUESTS = CONFIG.RATE_LIMIT_MAX || 10;
const WINDOW_MS = CONFIG.RATE_LIMIT_WINDOW || 10000;

/**
 * Checks if a key has exceeded the rate limit
 * @param {string} key - Rate limit key (e.g. tab ID or message type)
 * @returns {{ allowed: boolean, retryAfter?: number }}
 */
export function checkRateLimit(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    return { allowed: true };
  }
  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = WINDOW_MS - (now - entry.windowStart);
    return { allowed: false, retryAfter };
  }
  return { allowed: true };
}

/**
 * Records a request for the given key
 * @param {string} key
 */
export function recordRequest(key) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
  } else {
    entry.count++;
  }
}

/**
 * Clears the rate limit entry for a key
 * @param {string} key
 */
export function clearRateLimit(key) {
  rateLimitMap.delete(key);
}
