/**
 * Article content extractor
 * @module articleExtractor
 */

import { getTextContent, findElements, resolveUrl } from '../utils/domUtils.js';

/**
 * Extracts article data from a document
 * @param {Document} doc
 * @returns {object}
 */
export function extractArticle(doc = document) {
  return {
    title: extractTitle(doc),
    author: extractAuthor(doc),
    date: extractDate(doc),
    content: extractContent(doc),
    images: extractImages(doc),
    tags: extractTags(doc),
    description: extractDescription(doc),
    url: window.location.href,
  };
}

function extractTitle(doc) {
  return (
    doc.querySelector('[itemprop="headline"]')?.textContent ||
    doc.querySelector('article h1, main h1, h1')?.textContent ||
    doc.querySelector('meta[property="og:title"]')?.content ||
    doc.title || ''
  ).trim();
}

function extractAuthor(doc) {
  return (
    doc.querySelector('[itemprop="author"] [itemprop="name"]')?.textContent ||
    doc.querySelector('[itemprop="author"]')?.textContent ||
    doc.querySelector('[rel="author"]')?.textContent ||
    doc.querySelector('[class*="author"]')?.textContent ||
    doc.querySelector('meta[name="author"]')?.content || ''
  ).trim();
}

function extractDate(doc) {
  return (
    doc.querySelector('time[datetime]')?.getAttribute('datetime') ||
    doc.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
    doc.querySelector('[itemprop="datePublished"]')?.textContent ||
    doc.querySelector('meta[property="article:published_time"]')?.content || ''
  ).trim();
}

function extractContent(doc) {
  const selectors = [
    'article [itemprop="articleBody"]',
    'article',
    '[role="main"]',
    'main',
    '.post-content', '.article-content', '.entry-content',
  ];
  for (const sel of selectors) {
    const el = doc.querySelector(sel);
    if (el) return getTextContent(el);
  }
  return '';
}

function extractImages(doc) {
  const article = doc.querySelector('article, main, [role="main"]') || doc.body;
  return Array.from(article.querySelectorAll('img'))
    .map(img => ({
      src: resolveUrl(img.getAttribute('src') || img.getAttribute('data-src') || ''),
      alt: img.getAttribute('alt') || '',
    }))
    .filter(img => img.src);
}

function extractTags(doc) {
  const tagEls = doc.querySelectorAll('[rel="tag"], [class*="tag"], [class*="category"] a');
  return Array.from(tagEls).map(el => getTextContent(el)).filter(Boolean);
}

function extractDescription(doc) {
  return (
    doc.querySelector('meta[name="description"]')?.content ||
    doc.querySelector('meta[property="og:description"]')?.content || ''
  );
}
