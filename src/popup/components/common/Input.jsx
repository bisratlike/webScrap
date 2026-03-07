/**
 * Reusable Input component
 */

import React from 'react';

/**
 * @param {{ label?: string, error?: string, className?: string }} props
 */
export default function Input({
  label,
  error,
  className = '',
  id,
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-gray-600 dark:text-gray-400">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border
          bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500
          transition-colors
          ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200 dark:border-slate-600'}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...rest}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
