/**
 * Header component
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useScraper } from '../../context/ScraperContext.jsx';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants.js';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { scrapingStatus } = useScraper();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-blue-600 text-white flex-shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-md flex items-center justify-center text-xs font-bold">D</div>
        <span className="font-semibold text-base">DataSnap Pro</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[scrapingStatus] || 'bg-gray-400'}`} />
          <span className="text-xs text-blue-100">{STATUS_LABELS[scrapingStatus] || 'Idle'}</span>
        </div>
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded-md hover:bg-blue-700 transition-colors text-sm"
          title="Toggle theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
