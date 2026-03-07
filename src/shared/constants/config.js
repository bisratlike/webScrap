/**
 * Application configuration constants
 * @module config
 */
export const CONFIG = {
  MAX_CONCURRENT_SCRAPES: 3,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  STORAGE_KEY_PREFIX: 'datasnap_',
  MAX_RESULTS_PER_PAGE: 1000,
  SUPPORTED_EXPORT_FORMATS: ['csv', 'json', 'excel'],
  VERSION: '1.0.0',
  DEBUG: false,
  RATE_LIMIT_MAX: 10,
  RATE_LIMIT_WINDOW: 10000,
};
