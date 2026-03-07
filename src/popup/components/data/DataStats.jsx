import React from 'react';
import { useScraper } from '../../context/ScraperContext.jsx';
import { formatNumber } from '../../utils/formatters.js';

export default function DataStats() {
  const { extractedData } = useScraper();
  const fields = extractedData.length > 0 ? Object.keys(extractedData[0]).length : 0;
  const size = JSON.stringify(extractedData).length;

  const stats = [
    { label: 'Records', value: formatNumber(extractedData.length), icon: '📄' },
    { label: 'Fields', value: formatNumber(fields), icon: '🏷' },
    { label: 'Size', value: size < 1024 ? `${size}B` : `${(size / 1024).toFixed(1)}KB`, icon: '💾' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(s => (
        <div key={s.label} className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600 text-center">
          <div className="text-lg">{s.icon}</div>
          <div className="text-lg font-bold text-gray-800 dark:text-gray-200">{s.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
