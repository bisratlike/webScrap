/**
 * Data formatting service for popup display
 * @module popup/formattingService
 */

import { truncateText, formatDate, formatFieldName } from '../utils/formatters.js';

/**
 * Formats data for display in the UI
 * @param {Array<object>} data
 * @returns {Array<object>}
 */
export function formatDataForDisplay(data) {
  if (!Array.isArray(data)) return [];
  return data.map(record => {
    const formatted = {};
    Object.entries(record).forEach(([key, value]) => {
      formatted[formatFieldName(key)] = truncateText(String(value ?? ''), 80);
    });
    return formatted;
  });
}

export { truncateText, formatDate } from '../utils/formatters.js';
