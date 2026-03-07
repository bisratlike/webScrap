/**
 * Selector model
 * @module Selector
 */

import { generateId } from '../utils/idGenerator.js';

/** @enum {string} */
export const SelectorType = {
  TEXT: 'text',
  LINK: 'link',
  IMAGE: 'image',
  TABLE: 'table',
  LIST: 'list',
  CUSTOM: 'custom',
};

/**
 * Represents a CSS/XPath selector configuration
 */
export class Selector {
  /**
   * @param {object} [data]
   */
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.name = data.name || 'Untitled Selector';
    this.cssSelector = data.cssSelector || '';
    this.xpathSelector = data.xpathSelector || '';
    this.type = data.type || SelectorType.TEXT;
    this.multiple = data.multiple !== undefined ? data.multiple : false;
    this.transform = data.transform || null; // 'trim', 'lowercase', 'uppercase', 'number', null
    this.attribute = data.attribute || null; // 'href', 'src', 'data-*', null for text
  }

  /**
   * @returns {object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      cssSelector: this.cssSelector,
      xpathSelector: this.xpathSelector,
      type: this.type,
      multiple: this.multiple,
      transform: this.transform,
      attribute: this.attribute,
    };
  }

  /**
   * @param {object} data
   * @returns {Selector}
   */
  static fromJSON(data) {
    return new Selector(data);
  }

  /**
   * Validates the selector configuration
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];
    if (!this.name || this.name.trim() === '') errors.push('Selector must have a name');
    if (!this.cssSelector && !this.xpathSelector) {
      errors.push('Selector must have either a CSS selector or XPath selector');
    }
    if (!Object.values(SelectorType).includes(this.type)) {
      errors.push(`Invalid selector type: ${this.type}`);
    }
    return { valid: errors.length === 0, errors };
  }
}
