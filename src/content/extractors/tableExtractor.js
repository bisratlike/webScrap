/**
 * HTML table extractor
 * @module tableExtractor
 */

import { getTextContent } from '../utils/domUtils.js';

/**
 * Extracts all tables from a document
 * @param {Document} doc
 * @returns {Array<{headers: string[], rows: object[]}>}
 */
export function extractTables(doc = document) {
  const tables = Array.from(doc.querySelectorAll('table'));
  return tables.map(table => extractTable(table)).filter(t => t.rows.length > 0);
}

/**
 * Extracts a single table to an array of row objects
 * @param {HTMLTableElement} tableElement
 * @returns {{headers: string[], rows: object[], caption: string}}
 */
export function extractTable(tableElement) {
  const headers = getTableHeaders(tableElement);
  const rows = getTableRows(tableElement, headers);
  const caption = getTextContent(tableElement.querySelector('caption'));
  return { headers, rows, caption };
}

/**
 * Gets table headers from thead or first row
 * @param {HTMLTableElement} table
 * @returns {string[]}
 */
export function getTableHeaders(table) {
  const ths = table.querySelectorAll('thead th, thead td');
  if (ths.length > 0) return Array.from(ths).map(th => getTextContent(th) || `col${th.cellIndex}`);
  const firstRow = table.querySelector('tr');
  if (!firstRow) return [];
  return Array.from(firstRow.querySelectorAll('th, td')).map((cell, i) =>
    getTextContent(cell) || `col${i}`
  );
}

/**
 * Gets table rows as objects with header keys
 * @param {HTMLTableElement} table
 * @param {string[]} headers
 * @returns {object[]}
 */
export function getTableRows(table, headers) {
  const bodyRows = Array.from(table.querySelectorAll('tbody tr, tr')).filter(
    row => !row.closest('thead')
  );
  return bodyRows.map(row => {
    const cells = Array.from(row.querySelectorAll('td, th'));
    const rowObj = {};
    headers.forEach((header, i) => {
      rowObj[header] = getTextContent(cells[i]) || '';
    });
    return rowObj;
  }).filter(row => Object.values(row).some(v => v !== ''));
}
