/**
 * Main popup page
 */

import React, { useState } from 'react';
import Header from '../components/layout/Header.jsx';
import Footer from '../components/layout/Footer.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import ScraperControls from '../components/scraper/ScraperControls.jsx';
import DataPreview from '../components/data/DataPreview.jsx';
import ExportButtons from '../components/export/ExportButtons.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { TABS } from '../utils/constants.js';

function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings();
  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Settings</h2>
      <div className="space-y-3">
        {[
          { key: 'autoSave', label: 'Auto-save sessions' },
          { key: 'showNotifications', label: 'Show notifications' },
          { key: 'debugMode', label: 'Debug mode' },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
            <input type="checkbox" checked={!!settings[key]}
              onChange={e => updateSetting(key, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded" />
          </label>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Default Export Format</label>
          <select value={settings.defaultExportFormat || 'csv'}
            onChange={e => updateSetting('defaultExportFormat', e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200">
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="excel">Excel/TSV</option>
          </select>
        </div>
        <button onClick={resetSettings}
          className="w-full py-2 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

export default function IndexPage() {
  const [activeTab, setActiveTab] = useState(TABS.SCRAPER);
  return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-4">
          {activeTab === TABS.SCRAPER  && <ScraperControls />}
          {activeTab === TABS.DATA     && <DataPreview />}
          {activeTab === TABS.EXPORT   && <ExportButtons />}
          {activeTab === TABS.SETTINGS && <SettingsPage />}
        </main>
      </div>
      <Footer />
    </div>
  );
}
