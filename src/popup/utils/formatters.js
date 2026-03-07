/**
 * Display formatters for UI
 * @module popup/formatters
 */

/**
 * Formats a large number with K/M/B suffixes
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000)     return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)         return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

/**
 * Formats bytes to human-readable
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return `${val.toFixed(1)} ${units[i]}`;
}

/**
 * Formats duration in milliseconds to readable string
 * @param {number} ms
 * @returns {string}
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

/**
 * Converts camelCase to readable label
 * @param {string} name
 * @returns {string}
 */
export function formatFieldName(name) {
  if (!name) return '';
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

/**
 * Truncates text to a max length with ellipsis
 * @param {string} text
 * @param {number} [maxLength=50]
 * @returns {string}
 */
export function truncateText(text, maxLength = 50) {
  if (!text) return '';
  const str = String(text);
  return str.length > maxLength ? str.slice(0, maxLength - 3) + '...' : str;
}

/**
 * Formats a date for display
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return String(date);
  }
}
