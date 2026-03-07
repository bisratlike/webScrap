import React from 'react';

/**
 * @param {{ progress: number, status: string, message?: string }} props
 */
export default function ProgressIndicator({ progress = 0, status, message }) {
  const isRunning = status === 'running';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">{message || (isRunning ? 'Scraping...' : 'Ready')}</span>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${isRunning ? 'bg-blue-500' : progress === 100 ? 'bg-green-500' : 'bg-gray-300'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
