/**
 * Core extraction logic service
 * @module extractionService
 */

import { logDebug, logError } from '../../shared/utils/logging.js';

/**
 * Processes raw extracted data using provided selectors configuration
 * @param {Array<object>} rawData - Raw extracted records
 * @param {Array<object>} selectors - Selector configurations
 * @returns {Array<object>} Processed data records
 */
export function processRawData(rawData, selectors) {
  if (!Array.isArray(rawData)) return [];
  return rawData.map(record => {
    const processed = {};
    selectors.forEach(sel => {
      const value = record[sel.name] ?? record[sel.cssSelector] ?? null;
      processed[sel.name] = value !== null ? transformData(value, sel.transform) : null;
    });
    return processed;
  });
}

/**
 * Cleans and normalizes text
 * @param {string} text
 * @returns {string}
 */
export function cleanText(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .trim();
}

/**
 * Removes duplicate records from an array
 * @param {Array<object>} dataArray
 * @returns {Array<object>}
 */
export function deduplicateData(dataArray) {
  if (!Array.isArray(dataArray)) return [];
  const seen = new Set();
  return dataArray.filter(item => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Applies a transformation to a value
 * @param {*} data - Value to transform
 * @param {string|null} transformation - 'trim', 'lowercase', 'uppercase', 'number', 'boolean'
 * @returns {*} Transformed value
 */
export function transformData(data, transformation) {
  if (!transformation || data === null || data === undefined) return data;
  const str = String(data);
  switch (transformation) {
    case 'trim':      return str.trim();
    case 'lowercase': return str.toLowerCase();
    case 'uppercase': return str.toUpperCase();
    case 'number':    return parseFloat(str.replace(/[^0-9.-]/g, '')) || 0;
    case 'boolean':   return str.toLowerCase() === 'true' || str === '1';
    default:          return data;
  }
}

/**
 * Validates the structure of extracted data
 * @param {Array<object>} data
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateExtractedData(data) {
  const errors = [];
  if (!Array.isArray(data)) {
    errors.push('Data must be an array');
    return { valid: false, errors };
  }
  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) {
      errors.push(`Item at index ${index} is not an object`);
    }
  });
  return { valid: errors.length === 0, errors };
}

/**
 * Merges multiple datasets into one, deduplicating by field values
 * @param {Array<Array<object>>} datasets
 * @returns {Array<object>}
 */
export function mergeDataSets(datasets) {
  if (!Array.isArray(datasets)) return [];
  const merged = datasets.reduce((acc, dataset) => {
    if (Array.isArray(dataset)) acc.push(...dataset);
    return acc;
  }, []);
  return deduplicateData(merged);
}
