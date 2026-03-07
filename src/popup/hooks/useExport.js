/**
 * Custom hook for export operations
 * @module popup/useExport
 */

import { useState, useCallback } from 'react';
import { exportData as exportApiData } from '../services/apiService.js';

/**
 * @returns {{ exportData: Function, isExporting: boolean, lastExportInfo: object|null, error: string|null }}
 */
export function useExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportInfo, setLastExportInfo] = useState(null);
  const [error, setError] = useState(null);

  const exportData = useCallback(async (format, sessionId) => {
    if (!sessionId) { setError('No session to export'); return; }
    setIsExporting(true);
    setError(null);
    try {
      const result = await exportApiData(format, sessionId);
      setLastExportInfo({ format, filename: result?.filename, timestamp: new Date().toISOString() });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportData, isExporting, lastExportInfo, error };
}
