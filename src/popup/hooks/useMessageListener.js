/**
 * Custom hook for listening to Chrome runtime messages
 * @module popup/useMessageListener
 */

import { useEffect, useCallback } from 'react';

/**
 * Listens to chrome.runtime messages and calls handler
 * @param {Function} handler - Message handler function
 * @param {Array} deps - Dependency array
 */
export function useMessageListener(handler, deps = []) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableHandler = useCallback(handler, deps);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime) return;
    chrome.runtime.onMessage.addListener(stableHandler);
    return () => chrome.runtime.onMessage.removeListener(stableHandler);
  }, [stableHandler]);
}
