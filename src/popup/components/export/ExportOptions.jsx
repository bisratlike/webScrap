import React from 'react';

/**
 * @param {{ options: object, onChange: Function }} props
 */
export default function ExportOptions({ options = {}, onChange }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Options</h4>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" checked={options.includeHeaders !== false}
          onChange={e => onChange({ ...options, includeHeaders: e.target.checked })} />
        Include headers
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" checked={!!options.prettyPrint}
          onChange={e => onChange({ ...options, prettyPrint: e.target.checked })} />
        Pretty print (JSON)
      </label>
    </div>
  );
}
