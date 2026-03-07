/**
 * Pricing information extractor
 * @module pricingExtractor
 */

import { getTextContent, findElements } from '../utils/domUtils.js';

const CURRENCY_SYMBOLS = { '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR' };
const PRICE_REGEX = /([€$£¥₹])?\s*([\d,]+(?:\.\d{1,2})?)\s*(USD|EUR|GBP|JPY|INR)?/i;

/**
 * Extracts all pricing information from a document
 * @param {Document} doc
 * @returns {{prices: Array<object>, plans: Array<object>}}
 */
export function extractPricing(doc = document) {
  return {
    prices: extractAllPrices(doc),
    plans: extractSubscriptionPlans(doc),
    mainPrice: extractMainPrice(doc),
  };
}

/**
 * Parses a price string into amount and currency
 * @param {string} text
 * @returns {{amount: number|null, currency: string, original: string}}
 */
export function parsePrice(text) {
  if (!text) return { amount: null, currency: 'USD', original: text };
  const match = PRICE_REGEX.exec(text.trim());
  if (!match) return { amount: null, currency: 'USD', original: text };
  const symbol = match[1] || '';
  const amount = parseFloat(match[2].replace(/,/g, ''));
  const currency = match[3] || CURRENCY_SYMBOLS[symbol] || 'USD';
  return { amount, currency, original: text.trim() };
}

function extractAllPrices(doc) {
  const selectors = [
    '[itemprop="price"]', '[class*="price"]', '[class*="amount"]',
    '[data-price]', '[class*="cost"]', '.price',
  ];
  const prices = [];
  const seen = new Set();
  selectors.forEach(sel => {
    doc.querySelectorAll(sel).forEach(el => {
      const text = getTextContent(el) || el.getAttribute('content') || el.getAttribute('data-price');
      if (text && !seen.has(text)) {
        seen.add(text);
        prices.push({ ...parsePrice(text), element: sel });
      }
    });
  });
  return prices;
}

function extractMainPrice(doc) {
  const el = doc.querySelector('h1 ~ [class*="price"], [itemprop="price"], [class*="main-price"], [class*="current-price"]');
  return el ? parsePrice(getTextContent(el) || el.getAttribute('content')) : null;
}

function extractSubscriptionPlans(doc) {
  const planSelectors = ['[class*="plan"]', '[class*="pricing-card"]', '[class*="tier"]'];
  const plans = [];
  for (const sel of planSelectors) {
    const elements = doc.querySelectorAll(sel);
    if (elements.length > 1) {
      elements.forEach(el => {
        const name = getTextContent(el.querySelector('h2, h3, [class*="name"], [class*="title"]'));
        const priceEl = el.querySelector('[class*="price"], [itemprop="price"]');
        const price = priceEl ? parsePrice(getTextContent(priceEl)) : null;
        const features = Array.from(el.querySelectorAll('li')).map(li => getTextContent(li)).filter(Boolean);
        if (name || price) plans.push({ name, price, features });
      });
      if (plans.length > 0) break;
    }
  }
  return plans;
}
