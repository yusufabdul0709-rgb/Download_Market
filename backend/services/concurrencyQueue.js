'use strict';

const logger = require('../utils/logger');
const config = require('../config');

/**
 * Lightweight in-memory concurrency limiter using p-queue (ESM package).
 *
 * Two separate queues:
 *  - previewQueue  → limits concurrent preview/metadata fetches (default 3)
 *  - downloadQueue → limits concurrent downloads (default 2)
 *
 * This prevents flooding YouTube with too many simultaneous requests from
 * the same IP, which is the primary trigger for 429 rate limits.
 */

/** @type {import('p-queue').default | null} */
let _previewQueue = null;
/** @type {import('p-queue').default | null} */
let _downloadQueue = null;

/** Lazy-load p-queue (ESM-only package) and create the singleton queues */
async function _ensureQueues() {
  if (_previewQueue && _downloadQueue) return;

  const { default: PQueue } = await import('p-queue');

  _previewQueue = new PQueue({
    concurrency: config.concurrency.maxPreviews,
    // Space out requests: max 2 requests per second
    intervalCap: 2,
    interval: 1_000,
  });

  _downloadQueue = new PQueue({
    concurrency: config.concurrency.maxDownloads,
    // Downloads are heavy — max 1 new download per 2 seconds
    intervalCap: 1,
    interval: 2_000,
  });

  _previewQueue.on('error', (err) =>
    logger.error('[PreviewQueue] Task error', { error: err.message })
  );
  _downloadQueue.on('error', (err) =>
    logger.error('[DownloadQueue] Task error', { error: err.message })
  );

  logger.info(
    `[ConcurrencyQueue] Initialised — previews: ${config.concurrency.maxPreviews}, downloads: ${config.concurrency.maxDownloads}`
  );
}

/**
 * Add a task to the preview queue.
 * @param {Function} fn  Async function to run
 * @returns {Promise<*>}
 */
async function enqueuePreview(fn) {
  await _ensureQueues();
  return _previewQueue.add(fn);
}

/**
 * Add a task to the download queue.
 * @param {Function} fn  Async function to run
 * @returns {Promise<*>}
 */
async function enqueueDownload(fn) {
  await _ensureQueues();
  return _downloadQueue.add(fn);
}

/**
 * Get queue statistics (useful for health endpoint).
 */
async function getQueueStats() {
  await _ensureQueues();
  return {
    preview: {
      pending: _previewQueue.pending,
      size: _previewQueue.size,
    },
    download: {
      pending: _downloadQueue.pending,
      size: _downloadQueue.size,
    },
  };
}

module.exports = { enqueuePreview, enqueueDownload, getQueueStats };
