/**
 * Product data extractor for e-commerce pages
 * @module productExtractor
 */

import { getTextContent, getAttributeValue, findElements, resolveUrl } from '../utils/domUtils.js';

/**
 * Auto-detects and extracts all products from a page
 * @param {Document} doc
 * @returns {Array<object>}
 */
export function extractProducts(doc = document) {
  // Try schema.org JSON-LD first
  const jsonLdProducts = extractJsonLdProducts(doc);
  if (jsonLdProducts.length > 0) return jsonLdProducts;

  // Try OpenGraph
  const ogProduct = extractOpenGraphProduct(doc);
  if (ogProduct) return [ogProduct];

  // Try common e-commerce patterns
  const products = detectAndExtractProducts(doc);
  return products;
}

/**
 * Extracts a single product from an element
 * @param {Element} element
 * @returns {object}
 */
export function extractProduct(element) {
  return {
    name: extractProductName(element),
    price: extractProductPrice(element),
    image: extractProductImage(element),
    description: extractProductDescription(element),
    rating: extractProductRating(element),
    availability: extractProductAvailability(element),
    url: window.location.href,
  };
}

function extractJsonLdProducts(doc) {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const products = [];
  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent);
      const items = Array.isArray(data) ? data : [data];
      items.forEach(item => {
        if (item['@type'] === 'Product') {
          products.push({
            name: item.name,
            price: item.offers?.price || item.offers?.[0]?.price,
            currency: item.offers?.priceCurrency || item.offers?.[0]?.priceCurrency,
            description: item.description,
            image: Array.isArray(item.image) ? item.image[0] : item.image,
            rating: item.aggregateRating?.ratingValue,
            availability: item.offers?.availability,
          });
        }
      });
    } catch (_e) { /* invalid JSON-LD — skip */ }
  });
  return products;
}

function extractOpenGraphProduct(doc) {
  const getMeta = property => doc.querySelector(`meta[property="${property}"]`)?.content;
  const title = getMeta('og:title');
  if (!title) return null;
  return {
    name: title,
    price: getMeta('product:price:amount'),
    currency: getMeta('product:price:currency'),
    description: getMeta('og:description'),
    image: getMeta('og:image'),
    url: getMeta('og:url') || window.location.href,
  };
}

function detectAndExtractProducts(doc) {
  // Common product container selectors
  const containerSelectors = [
    '[itemtype*="Product"]', '[class*="product-item"]', '[class*="product-card"]',
    '[class*="product_item"]', '[data-product-id]', '[class*="item-card"]',
  ];
  for (const sel of containerSelectors) {
    const elements = doc.querySelectorAll(sel);
    if (elements.length > 0) {
      return Array.from(elements).map(el => extractProduct(el));
    }
  }
  return [];
}

function extractProductName(el) {
  const selectors = ['[itemprop="name"]', 'h1', 'h2', '[class*="title"]', '[class*="name"]'];
  for (const s of selectors) {
    const found = el.querySelector(s);
    if (found) return getTextContent(found);
  }
  return getTextContent(el.querySelector('h1, h2, h3'));
}

function extractProductPrice(el) {
  const selectors = ['[itemprop="price"]', '[class*="price"]', '[class*="amount"]', '[data-price]'];
  for (const s of selectors) {
    const found = el.querySelector(s);
    if (found) return getTextContent(found) || getAttributeValue(found, 'content');
  }
  return null;
}

function extractProductImage(el) {
  const img = el.querySelector('[itemprop="image"], img[class*="product"], img');
  return img ? (resolveUrl(getAttributeValue(img, 'src') || getAttributeValue(img, 'data-src'))) : null;
}

function extractProductDescription(el) {
  const found = el.querySelector('[itemprop="description"], [class*="description"], p');
  return found ? getTextContent(found) : null;
}

function extractProductRating(el) {
  const found = el.querySelector('[itemprop="ratingValue"], [class*="rating"], [class*="stars"]');
  if (!found) return null;
  return getAttributeValue(found, 'content') || getTextContent(found);
}

function extractProductAvailability(el) {
  const found = el.querySelector('[itemprop="availability"], [class*="stock"], [class*="availability"]');
  return found ? getTextContent(found) : null;
}
