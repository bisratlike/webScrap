/**
 * Export generation service
 * @module exportService
 */

import { logError, logDebug } from '../../shared/utils/logging.js';
import { createDownload } from '../utils/chromeApiWrapper.js';
import { ERRORS } from '../../shared/constants/errors.js';

/**
 * Converts data array to CSV string
 * @param {Array<object>} data
 * @returns {string} CSV content
 */
export function exportToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const escape = val => {
    const str = val === null || val === undefined ? '' : String(val);
    return str.includes(',') || str.includes('"') || str.includes('\n')
      ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const rows = data.map(row => headers.map(h => escape(row[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Converts data to formatted JSON string
 * @param {Array<object>} data
 * @returns {string} JSON content
 */
export function exportToJSON(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Converts data to TSV (Tab-Separated Values) as Excel alternative
 * @param {Array<object>} data
 * @returns {string} TSV content
 */
export function exportToExcel(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
      return val.replace(/\t/g, ' ');
    }).join('\t')
  );
  return [headers.join('\t'), ...rows].join('\n');
}

/**
 * Triggers a file download using chrome.downloads API
 * @param {string} content - File content
 * @param {string} filename - Download filename
 * @param {string} mimeType - MIME type
 * @returns {Promise<number>} Download ID
 */
export async function triggerDownload(content, filename, mimeType) {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const downloadId = await createDownload({ url, filename, saveAs: false });
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    logDebug('Download triggered', { filename, downloadId });
    return downloadId;
  } catch (err) {
    logError('Download failed', err);
    throw Object.assign(err, { type: ERRORS.EXPORT_ERROR });
  }
}

/**
 * Generates a timestamped filename for export
 * @param {string} format - 'csv', 'json', 'excel'
 * @param {string} [sessionName='export']
 * @returns {string}
 */
export function generateFilename(format, sessionName = 'export') {
  const ext = format === 'excel' ? 'tsv' : format;
  const date = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safeName = sessionName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
  return `${safeName}_${date}.${ext}`;
}
