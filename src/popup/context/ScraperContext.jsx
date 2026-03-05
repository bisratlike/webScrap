/**
 * Scraper state context
 * @module popup/ScraperContext
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { scrapeCurrentTab } from '../services/apiService.js';
import { MESSAGES } from '../../shared/constants/messages.js';
import { STATUS } from '../utils/constants.js';

const ScraperContext = createContext(null);

/**
 * @typedef {object} ScraperContextValue
 * @property {string} scrapingStatus
 * @property {number} progress
 * @property {Array<object>} extractedData
 * @property {object|null} currentSession
 * @property {Function} startScraping
 * @property {Function} stopScraping
 * @property {Function} clearData
 * @property {Function} setCurrentSession
 */

/**
 * Provides scraper state to child components
 * @param {{ children: React.ReactNode }} props
 */
export function ScraperProvider({ children }) {
  const [scrapingStatus, setScrapingStatus] = useState(STATUS.IDLE);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [error, setError] = useState(null);
  const activeJobRef = useRef(null);

  // Listen for progress updates from background
  React.useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;
    const listener = (message) => {
      if (message.type === MESSAGES.PROGRESS_UPDATE) {
        setProgress(message.percentage || 0);
      } else if (message.type === MESSAGES.SCRAPE_COMPLETE) {
        setScrapingStatus(STATUS.COMPLETE);
        setProgress(100);
        if (message.payload?.results) {
          setExtractedData(prev => [...prev, ...(message.payload.results || [])]);
        }
      } else if (message.type === MESSAGES.SCRAPE_ERROR) {
        setScrapingStatus(STATUS.ERROR);
        setError(message.payload?.error || 'Scraping failed');
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const startScraping = useCallback(async (selectors, extractType) => {
    try {
      setError(null);
      setScrapingStatus(STATUS.RUNNING);
      setProgress(0);
      const result = await scrapeCurrentTab(selectors, currentSession?.id, extractType);
      activeJobRef.current = result?.jobId;
    } catch (err) {
      setScrapingStatus(STATUS.ERROR);
      setError(err.message);
    }
  }, [currentSession]);

  const stopScraping = useCallback(async () => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({
        type: MESSAGES.SCRAPE_STOP,
        payload: { jobId: activeJobRef.current },
      });
    }
    setScrapingStatus(STATUS.IDLE);
    activeJobRef.current = null;
  }, []);

  const clearData = useCallback(() => {
    setExtractedData([]);
    setProgress(0);
    setScrapingStatus(STATUS.IDLE);
    setError(null);
  }, []);

  return (
    <ScraperContext.Provider value={{
      scrapingStatus, progress, extractedData, currentSession,
      error, startScraping, stopScraping, clearData, setCurrentSession,
    }}>
      {children}
    </ScraperContext.Provider>
  );
}

/**
 * Hook to use scraper context
 * @returns {ScraperContextValue}
 */
export function useScraper() {
  const ctx = useContext(ScraperContext);
  if (!ctx) throw new Error('useScraper must be used within ScraperProvider');
  return ctx;
}

export default ScraperContext;
