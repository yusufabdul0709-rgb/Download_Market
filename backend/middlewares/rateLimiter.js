'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * General API rate limiter.
 * Applied to all /api routes.
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,   // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests — please slow down.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: (req) => {
    // Skip rate limiting in development so you can iterate quickly
    return process.env.NODE_ENV === 'development' && process.env.SKIP_RATE_LIMIT === '1';
  },
});

/**
 * Stricter limiter for the download submission endpoint.
 * 10 submissions per minute per IP.
 */
const downloadLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many download requests — please wait a minute.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

/**
 * Strict limiter for the preview endpoint.
 * 20 requests per minute per IP.
 */
const previewLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many preview requests.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

module.exports = { generalLimiter, downloadLimiter, previewLimiter };
