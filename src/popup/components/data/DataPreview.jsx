import React, { useState } from 'react';
import DataTable from './DataTable.jsx';
import DataGrid from './DataGrid.jsx';
import DataStats from './DataStats.jsx';
import Button from '../common/Button.jsx';
import { useScraper } from '../../context/ScraperContext.jsx';

export default function DataPreview() {
  const { extractedData, clearData } = useScraper();
  const [view, setView] = useState('table');

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Extracted Data</h2>
        <div className="flex gap-1">
          {['table', 'grid'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-2 py-1 text-xs rounded ${view === v ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
              {v === 'table' ? '▦' : '⊞'}
            </button>
          ))}
          {extractedData.length > 0 && (
            <Button size="xs" variant="ghost" onClick={clearData}>Clear</Button>
          )}
        </div>
      </div>
      <DataStats />
      {view === 'table' ? <DataTable data={extractedData} /> : <DataGrid data={extractedData} />}
    </div>
  );
}
