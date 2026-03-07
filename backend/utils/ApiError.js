'use strict';

/**
 * Structured application error with HTTP status code.
 * Throw this anywhere in your controller/service for a clean JSON response.
 */
class ApiError extends Error {
  /**
   * @param {number} status   HTTP status code (e.g. 400, 401, 403, 404, 500)
   * @param {string} message  Human-readable error message
   */
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  static badRequest(msg)   { return new ApiError(400, msg); }
  static unauthorized(msg) { return new ApiError(401, msg || 'Unauthorized'); }
  static forbidden(msg)    { return new ApiError(403, msg || 'Forbidden'); }
  static notFound(msg)     { return new ApiError(404, msg || 'Not found'); }
  static conflict(msg)     { return new ApiError(409, msg); }
  static internal(msg)     { return new ApiError(500, msg || 'Internal server error'); }
  static unavailable(msg)  { return new ApiError(503, msg); }
}

module.exports = ApiError;
