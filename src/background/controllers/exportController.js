/**
 * Export controller
 * @module exportController
 */

import { getSession } from '../services/storageService.js';
import { exportToCSV, exportToJSON, exportToExcel, triggerDownload, generateFilename } from '../services/exportService.js';
import { validateExportRequest } from '../services/validationService.js';
import { createResponse } from '../utils/messageFormatter.js';
import { createErrorResponse } from '../middleware/errorHandler.js';
import { logInfo, logError } from '../../shared/utils/logging.js';

const MIME_TYPES = {
  csv: 'text/csv;charset=utf-8',
  json: 'application/json',
  excel: 'text/tab-separated-values;charset=utf-8',
};

/**
 * Handles export data request
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function exportData(req, sendResponse) {
  try {
    const validation = validateExportRequest(req);
    if (!validation.valid) {
      sendResponse(createResponse(false, null, validation.errors.join(', ')));
      return;
    }
    const { format, sessionId } = req.payload;
    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      sendResponse(createResponse(false, null, `Session ${sessionId} not found`));
      return;
    }
    const data = sessionData.extractedData || [];
    let content;
    if (format === 'csv') content = exportToCSV(data);
    else if (format === 'json') content = exportToJSON(data);
    else content = exportToExcel(data);

    const filename = generateFilename(format, sessionData.name);
    const downloadId = await triggerDownload(content, filename, MIME_TYPES[format]);
    logInfo('Export completed', { format, filename });
    sendResponse(createResponse(true, { downloadId, filename }));
  } catch (err) {
    logError('Export failed', err);
    sendResponse(createErrorResponse(err));
  }
}

/**
 * Previews export without downloading
 * @param {object} req
 * @param {Function} sendResponse
 */
export async function previewExport(req, sendResponse) {
  try {
    const { format, sessionId, maxRows = 10 } = req.payload || {};
    const sessionData = await getSession(sessionId);
    if (!sessionData) {
      sendResponse(createResponse(false, null, `Session ${sessionId} not found`));
      return;
    }
    const data = (sessionData.extractedData || []).slice(0, maxRows);
    let preview;
    if (format === 'csv') preview = exportToCSV(data);
    else if (format === 'json') preview = exportToJSON(data);
    else preview = exportToExcel(data);
    sendResponse(createResponse(true, { preview, totalRows: sessionData.extractedData?.length || 0 }));
  } catch (err) {
    sendResponse(createErrorResponse(err));
  }
}
