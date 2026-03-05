import React, { useState, useMemo } from 'react';
import { truncateText } from '../../utils/formatters.js';

/**
 * @param {{ data: Array<object> }} props
 */
export default function DataTable({ data = [] }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const headers = useMemo(() => data.length > 0 ? Object.keys(data[0]) : [], [data]);

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const av = String(a[sortKey] ?? '');
      const bv = String(b[sortKey] ?? '');
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [data, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (data.length === 0) {
    return <div className="text-center py-8 text-gray-400 text-sm">No data yet. Start scraping to see results.</div>;
  }

  return (
    <div className="overflow-auto max-h-64 rounded-lg border border-gray-100 dark:border-slate-600">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-gray-50 dark:bg-slate-700">
          <tr>
            {headers.map(h => (
              <th key={h} onClick={() => handleSort(h)}
                className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-600 select-none whitespace-nowrap">
                {h} {sortKey === h ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-700">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
              {headers.map(h => (
                <td key={h} className="px-3 py-1.5 text-gray-700 dark:text-gray-300 max-w-[120px]">
                  <span title={String(row[h] ?? '')}>{truncateText(String(row[h] ?? ''), 30)}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
