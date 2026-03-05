/**
 * Session data model
 * @module Session
 */

import { generateId } from '../utils/idGenerator.js';

/** @enum {string} */
export const SessionStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete',
  ERROR: 'error',
};

/**
 * Represents a scraping session
 */
export class Session {
  /**
   * @param {object} [data] - Initial session data
   */
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.name = data.name || `Session ${new Date().toLocaleString()}`;
    this.url = data.url || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.status = data.status || SessionStatus.IDLE;
    this.settings = data.settings || {};
    this.extractedData = data.extractedData || [];
    this.selectors = data.selectors || [];
    this.jobIds = data.jobIds || [];
  }

  /**
   * Serializes session to plain object
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      url: this.url,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      status: this.status,
      settings: this.settings,
      extractedData: this.extractedData,
      selectors: this.selectors,
      jobIds: this.jobIds,
    };
  }

  /**
   * Creates a Session from a plain object
   * @param {object} data
   * @returns {Session}
   */
  static fromJSON(data) {
    return new Session(data);
  }

  /**
   * Validates the session has required fields
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this.id) errors.push('Session must have an id');
    if (!this.name) errors.push('Session must have a name');
    if (!Object.values(SessionStatus).includes(this.status)) {
      errors.push(`Invalid status: ${this.status}`);
    }
    return { valid: errors.length === 0, errors };
  }

  /**
   * Updates the session's updatedAt timestamp
   */
  touch() {
    this.updatedAt = new Date().toISOString();
  }
}
