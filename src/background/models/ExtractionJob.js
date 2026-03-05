/**
 * ExtractionJob data model
 * @module ExtractionJob
 */

import { generateJobId } from '../utils/idGenerator.js';

/** @enum {string} */
export const JobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete',
  ERROR: 'error',
  CANCELLED: 'cancelled',
};

/**
 * Represents a single extraction job
 */
export class ExtractionJob {
  /**
   * @param {object} [data]
   */
  constructor(data = {}) {
    this.id = data.id || generateJobId();
    this.sessionId = data.sessionId || null;
    this.url = data.url || '';
    this.selectors = data.selectors || [];
    this.status = data.status || JobStatus.PENDING;
    this.progress = data.progress || { current: 0, total: 0, percentage: 0 };
    this.startedAt = data.startedAt || null;
    this.completedAt = data.completedAt || null;
    this.results = data.results || [];
    this.errors = data.errors || [];
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      url: this.url,
      selectors: this.selectors,
      status: this.status,
      progress: this.progress,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      results: this.results,
      errors: this.errors,
    };
  }

  /**
   * @param {object} data
   * @returns {ExtractionJob}
   */
  static fromJSON(data) {
    return new ExtractionJob(data);
  }

  /**
   * Updates job progress
   * @param {number} current
   * @param {number} total
   */
  updateProgress(current, total) {
    this.progress = {
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    };
  }

  /**
   * Marks job as complete
   * @param {Array} results
   */
  markComplete(results) {
    this.status = JobStatus.COMPLETE;
    this.completedAt = new Date().toISOString();
    this.results = results;
    this.updateProgress(this.progress.total, this.progress.total);
  }

  /**
   * Marks job as errored
   * @param {Error|string} error
   */
  markError(error) {
    this.status = JobStatus.ERROR;
    this.completedAt = new Date().toISOString();
    this.errors.push({
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
}
