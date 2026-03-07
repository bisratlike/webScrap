'use strict';

/**
 * Wraps an async route handler so thrown errors are forwarded to
 * Express's next(err) without needing try/catch in every controller.
 *
 * @param {Function} fn  Async route handler (req, res, next)
 * @returns {Function}
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
