/**
 * Toast notification component
 */

import React, { useEffect } from 'react';

const TYPES = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-blue-600 text-white',
  warning: 'bg-amber-500 text-white',
};

/**
 * @param {{ message: string, type?: string, onDismiss?: Function, duration?: number }} props
 */
export default function Toast({ message, type = 'info', onDismiss, duration = 3000 }) {
  useEffect(() => {
    if (!duration || !onDismiss) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${TYPES[type] || TYPES.info}`}>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="opacity-75 hover:opacity-100 ml-2">✕</button>
      )}
    </div>
  );
}
