import React from 'react';
import { EXPORT_FORMATS } from '../../utils/constants.js';

/**
 * @param {{ value: string, onChange: Function }} props
 */
export default function FormatSelector({ value, onChange }) {
  return (
    <div className="space-y-1.5">
      {EXPORT_FORMATS.map(fmt => (
        <label key={fmt.value}
          className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
            value === fmt.value
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50'
          }`}>
          <input type="radio" name="export-format" value={fmt.value}
            checked={value === fmt.value} onChange={() => onChange(fmt.value)}
            className="text-blue-600" />
          <div>
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{fmt.label}</div>
            <div className="text-xs text-gray-400">{fmt.description}</div>
          </div>
        </label>
      ))}
    </div>
  );
}
