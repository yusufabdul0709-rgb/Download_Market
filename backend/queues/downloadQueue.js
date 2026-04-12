'use strict';

const { Queue } = require('bullmq');
const config = require('../config');
const { getClient } = require('../config/redis');
const logger = require('../utils/logger');

/** @type {Queue | null} */
let _queue = null;

/**
 * Return (and lazily create) the singleton BullMQ downloadQueue.
 * @returns {Queue}
 */
function getDownloadQueue() {
  if (_queue) return _queue;

  _queue = new Queue(config.queue.name, {
    connection: getClient(),
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 3_000 },
      removeOnComplete: { count: 50 },
      removeOnFail: { count: 50 },
    },
  });

  _queue.on('error', (err) =>
    logger.error('[Queue] Error', { error: err.message })
  );

  logger.info(`[Queue] "${config.queue.name}" initialised`);
  return _queue;
}

/**
 * Gracefully close the queue connection.
 */
async function closeQueue() {
  if (_queue) {
    await _queue.close();
    _queue = null;
  }
}

module.exports = { getDownloadQueue, closeQueue };
