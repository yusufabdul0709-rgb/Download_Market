'use strict';

/**
 * Wrap an Express route handler so unhandled promise rejections are forwarded
 * to Express's error middleware automatically.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res, next) => { ... }));
 *
 * @param {Function} fn  Async route handler
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a structured API error response object.
 *
 * @param {string}  message       Human-readable error message
 * @param {number}  [statusCode]  HTTP status code (default 400)
 * @param {string}  [code]        Machine-readable error code
 */
class AppError extends Error {
  constructor(message, statusCode = 400, code = 'APP_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { asyncHandler, AppError };
