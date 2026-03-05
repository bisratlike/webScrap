import React from 'react';
import { truncateText, formatFieldName } from '../../utils/formatters.js';

/**
 * @param {{ data: Array<object> }} props
 */
export default function DataGrid({ data = [] }) {
  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-400 text-sm">No data to display.</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
      {data.slice(0, 20).map((item, i) => (
        <div key={i} className="p-2.5 rounded-lg border border-gray-100 dark:border-slate-600 bg-white dark:bg-slate-800 space-y-1">
          {Object.entries(item).slice(0, 4).map(([key, value]) => (
            <div key={key}>
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">{formatFieldName(key)}</span>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{truncateText(String(value ?? ''), 40)}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
