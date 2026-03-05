/**
 * Unique ID generation utilities
 * @module idGenerator
 */

/**
 * Generates a unique ID using crypto.randomUUID or a fallback
 * @returns {string}
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates a session-specific ID
 * @returns {string}
 */
export function generateSessionId() {
  return `session_${generateId()}`;
}

/**
 * Generates a job-specific ID
 * @returns {string}
 */
export function generateJobId() {
  return `job_${generateId()}`;
}

/**
 * Generates a timestamped ID with an optional prefix
 * @param {string} [prefix='id']
 * @returns {string}
 */
export function generateTimestampedId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
