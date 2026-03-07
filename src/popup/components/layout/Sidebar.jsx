/**
 * Sidebar navigation component
 */

import React from 'react';
import { TABS } from '../../utils/constants.js';

const TAB_ICONS = {
  [TABS.SCRAPER]:  '⚡',
  [TABS.DATA]:     '📊',
  [TABS.EXPORT]:   '📥',
  [TABS.SETTINGS]: '⚙️',
};

const TAB_LABELS = {
  [TABS.SCRAPER]:  'Scraper',
  [TABS.DATA]:     'Data',
  [TABS.EXPORT]:   'Export',
  [TABS.SETTINGS]: 'Settings',
};

/**
 * @param {{ activeTab: string, onTabChange: Function }} props
 */
export default function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="flex flex-col w-16 bg-slate-800 dark:bg-slate-900 flex-shrink-0">
      {Object.values(TABS).map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            flex flex-col items-center justify-center py-3 gap-1 text-xs transition-colors
            ${activeTab === tab
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'}
          `}
          title={TAB_LABELS[tab]}
        >
          <span className="text-lg">{TAB_ICONS[tab]}</span>
          <span className="text-[10px] leading-none">{TAB_LABELS[tab]}</span>
        </button>
      ))}
    </aside>
  );
}
