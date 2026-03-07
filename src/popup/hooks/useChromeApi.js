/**
 * Custom hook wrapping Chrome APIs
 * @module popup/useChromeApi
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * @returns {{ currentTab: object|null, sendMessage: Function, getCurrentTab: Function, loading: boolean }}
 */
export function useChromeApi() {
  const [currentTab, setCurrentTab] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentTab = useCallback(() => {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      setLoading(false);
      return Promise.resolve(null);
    }
    return new Promise(resolve => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs?.[0] || null;
        setCurrentTab(tab);
        setLoading(false);
        resolve(tab);
      });
    });
  }, []);

  useEffect(() => { getCurrentTab(); }, [getCurrentTab]);

  const sendMessage = useCallback((type, payload = {}) => {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(new Error('Chrome runtime not available'));
        return;
      }
      chrome.runtime.sendMessage({ type, payload }, response => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else resolve(response);
      });
    });
  }, []);

  return { currentTab, sendMessage, getCurrentTab, loading };
}
