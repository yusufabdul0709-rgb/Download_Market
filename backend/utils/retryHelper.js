'use strict';

const logger = require('./logger');

/**
 * Retry an async function with exponential backoff.
 *
 * @param {Function} fn                    Async function to execute
 * @param {object}   opts
 * @param {number}   [opts.maxRetries=2]   Maximum number of retries (not counting the first attempt)
 * @param {number}   [opts.initialDelay=3000]  Initial delay in ms before first retry
 * @param {number}   [opts.maxDelay=15000]     Maximum delay cap
 * @param {Function} [opts.shouldRetry]    Predicate: (error, attempt) => boolean
 * @param {string}   [opts.label='retry'] Label for log messages
 * @returns {Promise<*>}
 */
async function retryWithBackoff(fn, {
  maxRetries = 2,
  initialDelay = 3_000,
  maxDelay = 15_000,
  shouldRetry = () => true,
  label = 'retry',
} = {}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt >= maxRetries || !shouldRetry(err, attempt)) {
        throw err;
      }

      // Exponential backoff with jitter
      const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.floor(Math.random() * 1000);
      const totalDelay = delay + jitter;

      logger.warn(`[${label}] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${totalDelay}ms…`);
      await sleep(totalDelay);
    }
  }

  throw lastError;
}

/**
 * Check if an error looks like a retryable rate-limit / transient failure.
 *
 * @param {Error} err
 * @returns {boolean}
 */
function isRetryableError(err) {
  const msg = (err.message || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('too many requests') ||
    msg.includes('rate') ||
    msg.includes('temporarily') ||
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('socket hang up')
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { retryWithBackoff, isRetryableError };
