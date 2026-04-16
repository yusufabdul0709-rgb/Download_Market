const { Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../config/logger');
const { extractMedia } = require('../services/ytdlp.service');

const EXTRACT_QUEUE = 'extractQueue';

const worker = new Worker(
  EXTRACT_QUEUE,
  async (job) => {
    logger.info(`[Worker] Started job ${job.id} for URL: ${job.data.url}`);
    
    try {
      const result = await extractMedia(job.data.url, job.data.platform, job.data.type);
      return result;
    } catch (err) {
      logger.error(`[Worker] Job ${job.id} failed: ${err.message}`);
      // Throwing error here marks job as failed in BullMQ
      throw err;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Limit exactly as requested
  }
);

worker.on('failed', (job, err) => {
  logger.warn(`[Worker] Job ${job ? job.id : 'unknown'} failed permanently: ${err.message}`);
});

logger.info(`[Worker] Listening on queue ${EXTRACT_QUEUE} with concurrency 5`);

module.exports = worker;
