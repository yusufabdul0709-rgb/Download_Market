'use strict';

const logger = require('../utils/logger');

/**
 * Global Express error handler.
 * Must be registered LAST, after all routes.
 *
 * @type {import('express').ErrorRequestHandler}
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log the error
  if (err.isOperational) {
    logger.warn(`[ErrorHandler] Operational error: ${err.message}`, {
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error('[ErrorHandler] Unexpected error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    error: err.isOperational ? err.message : 'An internal server error occurred.',
    code,
    ...(process.env.NODE_ENV === 'development' && !err.isOperational
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;
