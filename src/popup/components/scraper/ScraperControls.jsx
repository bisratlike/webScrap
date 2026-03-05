import React, { useState } from 'react';
import Button from '../common/Button.jsx';
import SelectorPanel from './SelectorPanel.jsx';
import ProgressIndicator from './ProgressIndicator.jsx';
import StatusBadge from './StatusBadge.jsx';
import { useScraper } from '../../context/ScraperContext.jsx';
import { useChromeApi } from '../../hooks/useChromeApi.js';
import { STATUS } from '../../utils/constants.js';
import { truncateText } from '../../utils/formatters.js';

export default function ScraperControls() {
  const { scrapingStatus, progress, startScraping, stopScraping, error } = useScraper();
  const { currentTab, loading } = useChromeApi();
  const [selectors, setSelectors] = useState([]);
  const [extractType, setExtractType] = useState('custom');
  const isRunning = scrapingStatus === STATUS.RUNNING;

  const handleStart = () => {
    if (extractType === 'custom' && selectors.length === 0) return;
    startScraping(selectors, extractType);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Web Scraper</h2>
        <StatusBadge status={scrapingStatus} />
      </div>

      <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-600">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Current Page</p>
        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
          {loading ? 'Loading...' : (currentTab?.title || truncateText(currentTab?.url || 'No active tab', 60))}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Extract Mode</label>
        <select value={extractType} onChange={e => setExtractType(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200">
          <option value="custom">Custom Selectors</option>
          <option value="auto">Auto-Detect</option>
          <option value="article">Article</option>
          <option value="products">Products</option>
          <option value="tables">Tables</option>
          <option value="pricing">Pricing</option>
        </select>
      </div>

      {extractType === 'custom' && (
        <SelectorPanel selectors={selectors} onSelectorsChange={setSelectors} />
      )}

      <ProgressIndicator progress={progress} status={scrapingStatus} />

      {error && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex gap-2">
        {!isRunning ? (
          <Button
            className="flex-1"
            onClick={handleStart}
            disabled={extractType === 'custom' && selectors.length === 0}
            loading={scrapingStatus === STATUS.RUNNING}
          >
            ▶ Start Scraping
          </Button>
        ) : (
          <Button className="flex-1" variant="danger" onClick={stopScraping}>
            ■ Stop
          </Button>
        )}
      </div>
    </div>
  );
}
