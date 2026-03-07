/**
 * Footer component
 */

import React from 'react';
import { CONFIG } from '../../../shared/constants/config.js';

export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex-shrink-0">
      <span className="text-xs text-gray-400">DataSnap Pro v{CONFIG.VERSION}</span>
      <span className="text-xs text-gray-400">Enterprise Web Scraper</span>
    </footer>
  );
}
