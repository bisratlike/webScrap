import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../../utils/constants.js';

/**
 * @param {{ status: string, className?: string }} props
 */
export default function StatusBadge({ status = 'idle', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-400'}`} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
