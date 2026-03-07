/**
 * DataSnap Pro - Content Script Entry Point
 * @module content/index
 */

import { MESSAGES } from '../shared/constants/messages.js';
import { extract } from './extractors/customExtractor.js';
import { extractArticle } from './extractors/articleExtractor.js';
import { extractProducts } from './extractors/productExtractor.js';
import { extractTables } from './extractors/tableExtractor.js';
import { extractPricing } from './extractors/pricingExtractor.js';
import { detectPatterns } from './detectors/patternDetector.js';
import { detectPagination } from './detectors/paginationDetector.js';
import { startSelection, stopSelection } from './selectors/visualSelector.js';

let isScrapingActive = false;
let currentJobId = null;

/**
 * Performs scraping based on selectors
 * @param {object} payload
 * @returns {Promise<Array<object>>}
 */
async function performScraping(payload) {
  const { selectors = [], extractType = 'custom' } = payload;

  switch (extractType) {
    case 'article':  return [extractArticle(document)];
    case 'products': return extractProducts(document);
    case 'tables':   return extractTables(document);
    case 'pricing':  return [extractPricing(document)];
    case 'auto': {
      const patterns = detectPatterns(document);
      if (patterns.length > 0 && selectors.length === 0) {
        const autoSelectors = patterns[0].fields.map(f => ({ name: f, cssSelector: f, multiple: true }));
        return extract(document, autoSelectors);
      }
      return extract(document, selectors);
    }
    default: return extract(document, selectors);
  }
}

// Listen for messages from background service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return false;

  switch (message.type) {
    case MESSAGES.SCRAPE_START: {
      const { jobId, selectors, url, extractType } = message.payload || {};
      isScrapingActive = true;
      currentJobId = jobId;

      performScraping({ selectors, extractType })
        .then(results => {
          isScrapingActive = false;
          // Send results back to background
          chrome.runtime.sendMessage({
            type: MESSAGES.SCRAPE_COMPLETE,
            payload: { jobId, sessionId: message.payload.sessionId, results },
          });
          sendResponse({ success: true, results });
        })
        .catch(err => {
          isScrapingActive = false;
          chrome.runtime.sendMessage({
            type: MESSAGES.SCRAPE_ERROR,
            payload: { jobId, sessionId: message.payload.sessionId, error: err.message },
          });
          sendResponse({ success: false, error: err.message });
        });
      return true; // Async response
    }

    case MESSAGES.SCRAPE_STOP:
      isScrapingActive = false;
      currentJobId = null;
      sendResponse({ success: true });
      break;

    case MESSAGES.SELECT_START:
      startSelection(info => {
        chrome.runtime.sendMessage({
          type: MESSAGES.SELECT_ELEMENT,
          payload: info,
        });
      });
      sendResponse({ success: true });
      break;

    case MESSAGES.SELECT_STOP:
      stopSelection();
      sendResponse({ success: true });
      break;

    case MESSAGES.STATUS_UPDATE:
      sendResponse({ success: true, status: isScrapingActive ? 'running' : 'idle', jobId: currentJobId });
      break;

    default:
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
  }

  return false;
});
