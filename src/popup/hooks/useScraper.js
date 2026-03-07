/**
 * Custom hook for scraping operations
 * @module popup/useScraper
 */

import { useState, useCallback } from 'react';
import { MESSAGES } from '../../shared/constants/messages.js';
import { STATUS } from '../utils/constants.js';
import { useMessageListener } from './useMessageListener.js';

/**
 * @returns {{ startScraping: Function, stopScraping: Function, status: string, progress: number, data: Array, error: string|null }}
 */
export function useScraper() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);

  useMessageListener((message) => {
    switch (message.type) {
      case MESSAGES.PROGRESS_UPDATE:
        setProgress(message.percentage || 0);
        break;
      case MESSAGES.SCRAPE_COMPLETE:
        setStatus(STATUS.COMPLETE);
        setProgress(100);
        if (message.payload?.results) {
          setData(prev => [...prev, ...(message.payload.results || [])]);
        }
        break;
      case MESSAGES.SCRAPE_ERROR:
        setStatus(STATUS.ERROR);
        setError(message.payload?.error || 'Scraping error');
        break;
    }
  }, []);

  const startScraping = useCallback(async (selectors = [], extractType = 'custom') => {
    if (typeof chrome === 'undefined' || !chrome.runtime) {
      setError('Chrome runtime not available');
      return;
    }
    setStatus(STATUS.RUNNING);
    setProgress(0);
    setError(null);

    chrome.runtime.sendMessage(
      { type: MESSAGES.SCRAPE_START, payload: { selectors, extractType } },
      response => {
        if (chrome.runtime.lastError || !response?.success) {
          setStatus(STATUS.ERROR);
          setError(response?.error || chrome.runtime.lastError?.message || 'Failed to start');
        } else {
          setJobId(response.data?.jobId);
        }
      }
    );
  }, []);

  const stopScraping = useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: MESSAGES.SCRAPE_STOP, payload: { jobId } });
    }
    setStatus(STATUS.IDLE);
    setJobId(null);
  }, [jobId]);

  return { startScraping, stopScraping, status, progress, data, error };
}
