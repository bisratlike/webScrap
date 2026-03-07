import React, { useState } from 'react';
import Button from '../common/Button.jsx';
import FormatSelector from './FormatSelector.jsx';
import ExportOptions from './ExportOptions.jsx';
import Toast from '../common/Toast.jsx';
import { useScraper } from '../../context/ScraperContext.jsx';
import { useExport } from '../../hooks/useExport.js';

export default function ExportButtons() {
  const { currentSession, extractedData } = useScraper();
  const { exportData, isExporting, lastExportInfo, error } = useExport();
  const [format, setFormat] = useState('csv');
  const [options, setOptions] = useState({ includeHeaders: true, prettyPrint: false });
  const [toast, setToast] = useState(null);

  const handleExport = async () => {
    if (!currentSession?.id && extractedData.length === 0) {
      setToast({ message: 'No data to export', type: 'warning' });
      return;
    }
    await exportData(format, currentSession?.id);
    if (!error) setToast({ message: `Exported as ${format.toUpperCase()}`, type: 'success' });
    else setToast({ message: error, type: 'error' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Export Data</h2>
        <span className="text-xs text-gray-500">{extractedData.length} records</span>
      </div>

      <FormatSelector value={format} onChange={setFormat} />
      <ExportOptions options={options} onChange={setOptions} />

      <Button className="w-full" onClick={handleExport} loading={isExporting}
        disabled={extractedData.length === 0}>
        ⬇ Download {format.toUpperCase()}
      </Button>

      {lastExportInfo && (
        <p className="text-xs text-green-600 dark:text-green-400">
          Last export: {lastExportInfo.filename} ({lastExportInfo.format})
        </p>
      )}

      {toast && (
        <div className="fixed bottom-4 right-4">
          <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}
