const { Queue, Job } = require('bullmq');
const queueConfig = require('../config/queue');
const logger = require('../config/logger');

const EXTRACT_QUEUE = 'extractQueue';

const extractionQueue = new Queue(EXTRACT_QUEUE, queueConfig);

async function enqueueExtraction(url, platform, type) {
  // Use URL as job ID to deduplicate in-flight requests natively with BullMQ
  // If the same URL is submitted while the job is still active, it skips creation
  const deduplicationId = `extract:${Buffer.from(url).toString('base64')}`;

  const job = await extractionQueue.add(
    'extract_media',
    { url, platform, type },
    { jobId: deduplicationId }
  );

  return job;
}

async function getJobResult(job) {
  // Wait for job completion
  try {
    const result = await job.waitUntilFinished(extractionQueue.events);
    return result;
  } catch (err) {
    // Err here is the rejected Error message from the worker
    const message = typeof err === 'string' ? err : err.message;
    throw new Error(message || 'EXTRACTION_FAILED');
  }
}

module.exports = { enqueueExtraction, getJobResult, extractionQueue };
