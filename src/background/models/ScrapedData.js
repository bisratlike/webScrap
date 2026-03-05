/**
 * ScrapedData model
 * @module ScrapedData
 */

import { generateId } from '../utils/idGenerator.js';

/**
 * Represents scraped data from a single page/element
 */
export class ScrapedData {
  /**
   * @param {object} [data]
   */
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.jobId = data.jobId || null;
    this.url = data.url || '';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.fields = data.fields || {};
    this.rawHtml = data.rawHtml || '';
    this.metadata = data.metadata || {};
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      jobId: this.jobId,
      url: this.url,
      timestamp: this.timestamp,
      fields: this.fields,
      rawHtml: this.rawHtml,
      metadata: this.metadata,
    };
  }

  /**
   * @param {object} data
   * @returns {ScrapedData}
   */
  static fromJSON(data) {
    return new ScrapedData(data);
  }

  /**
   * Adds a field to the scraped data
   * @param {string} name - Field name
   * @param {*} value - Field value
   */
  addField(name, value) {
    this.fields[name] = value;
  }

  /**
   * Gets a field value
   * @param {string} name
   * @returns {*}
   */
  getField(name) {
    return this.fields[name];
  }
}
