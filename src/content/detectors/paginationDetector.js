/**
 * Pagination detector
 * @module paginationDetector
 */

import { resolveUrl } from '../utils/domUtils.js';

/**
 * Detects pagination on a page
 * @param {Document} doc
 * @returns {{hasPagination: boolean, type: string, links: string[], nextUrl: string|null, totalPages: number|null}}
 */
export function detectPagination(doc = document) {
  const links = getPaginationLinks(doc);
  const nextUrl = getNextPageUrl(doc);
  const totalPages = getTotalPages(doc);
  return {
    hasPagination: links.length > 0 || !!nextUrl,
    type: detectPaginationType(doc),
    links,
    nextUrl,
    totalPages,
  };
}

/**
 * Gets all pagination links
 * @param {Document} doc
 * @returns {string[]}
 */
export function getPaginationLinks(doc = document) {
  const selectors = [
    '[class*="pagination"] a', '[class*="pager"] a', 'nav[role="navigation"] a',
    '[aria-label="pagination"] a', '.page-numbers a',
  ];
  const links = new Set();
  selectors.forEach(sel => {
    doc.querySelectorAll(sel).forEach(a => {
      const href = a.getAttribute('href');
      if (href && href !== '#') links.add(resolveUrl(href));
    });
  });
  return Array.from(links);
}

/**
 * Gets the next page URL
 * @param {Document} doc
 * @returns {string|null}
 */
export function getNextPageUrl(doc = document) {
  const nextLink =
    doc.querySelector('a[rel="next"]') ||
    doc.querySelector('[class*="next"] a, a[class*="next"]') ||
    doc.querySelector('[aria-label="Next page"], [aria-label="Next"]');
  if (nextLink) return resolveUrl(nextLink.getAttribute('href'));
  return null;
}

/**
 * Estimates total pages
 * @param {Document} doc
 * @returns {number|null}
 */
export function getTotalPages(doc = document) {
  // Try to find "Page X of Y" text
  const pageText = doc.body.textContent.match(/page\s+\d+\s+of\s+(\d+)/i);
  if (pageText) return parseInt(pageText[1]);

  // Count pagination links
  const links = getPaginationLinks(doc);
  const pageNumbers = links.map(l => {
    const match = l.match(/[?&]page=(\d+)|\/page\/(\d+)|\/(\d+)\/?$/);
    return match ? parseInt(match[1] || match[2] || match[3]) : null;
  }).filter(Boolean);

  return pageNumbers.length > 0 ? Math.max(...pageNumbers) : null;
}

function detectPaginationType(doc) {
  if (doc.querySelector('[class*="infinite"], [class*="load-more"]')) return 'infinite';
  if (doc.querySelector('a[rel="next"]')) return 'next-prev';
  if (getPaginationLinks(doc).length > 0) return 'numbered';
  return 'none';
}
