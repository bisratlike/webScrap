'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Global error handler.
 * Must be registered as the LAST middleware in Express.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ error: message });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || err.keyPattern || {})[0] || 'Record';
    return res.status(409).json({ error: `${field} already in use` });
  }

  // Our own structured API errors
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Express/JWT specific status codes
  const status = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error(err.stack || err);
  }

  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
