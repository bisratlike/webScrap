/**
 * Frontend UI constants
 * @module popup/constants
 */

export const TABS = {
  SCRAPER: 'scraper',
  DATA: 'data',
  EXPORT: 'export',
  SETTINGS: 'settings',
};

export const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETE: 'complete',
  ERROR: 'error',
};

export const STATUS_COLORS = {
  idle: 'bg-gray-400',
  running: 'bg-blue-500',
  paused: 'bg-yellow-500',
  complete: 'bg-green-500',
  error: 'bg-red-500',
};

export const STATUS_LABELS = {
  idle: 'Idle',
  running: 'Running',
  paused: 'Paused',
  complete: 'Complete',
  error: 'Error',
};

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
  { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' },
  { value: 'excel', label: 'Excel/TSV', description: 'Tab-separated values' },
];
