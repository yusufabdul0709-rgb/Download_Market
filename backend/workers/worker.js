'use strict';

require('dotenv').config();

const { Worker } = require('bullmq');
const { QUEUE_NAME, isRedisQueueEnabled } = require('../queue/jobQueue');
const { getClient } = require('../config/redis');
const { processVideoJob } = require('../services/queueDownloadProcessor');
const logger = require('../utils/logger');

if (!isRedisQueueEnabled()) {
  logger.warn('[Worker] Redis is not enabled. Dedicated BullMQ worker is disabled.');
  process.exit(0);
}

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { url } = job.data;
    return processVideoJob({ url });
  },
  {
    connection: getClient(),
    concurrency: parseInt(process.env.QUEUE_WORKER_CONCURRENCY, 10) || 8,
  }
);

worker.on('completed', (job) => {
  logger.info(`[Worker] Job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  logger.error('[Worker] Job failed', { id: job?.id, message: err.message });
});

logger.info('[Worker] BullMQ worker started');
