'use strict';

const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { enqueueDownload } = require('../services/concurrencyQueue');
const { getClient } = require('../config/redis');
const logger = require('../utils/logger');

const QUEUE_NAME = 'video-processing';
let processor = null;
const memoryJobs = new Map();

function isRedisQueueEnabled() {
  return Boolean(config.redis?.enabled);
}

async function addVideoJob(data) {
  if (isRedisQueueEnabled()) {
    const { Queue } = require('bullmq');
    const queue = new Queue(QUEUE_NAME, { connection: getClient() });
    const job = await queue.add('process-video', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 100,
    });
    return { id: String(job.id) };
  }

  const id = uuidv4();
  memoryJobs.set(id, { id, state: 'waiting', data, returnvalue: null, failedReason: null });

  enqueueDownload(async () => {
    const record = memoryJobs.get(id);
    if (!record || !processor) return;
    record.state = 'active';
    try {
      const result = await processor(record.data);
      record.returnvalue = result;
      record.state = 'completed';
    } catch (err) {
      record.failedReason = err.message;
      record.state = 'failed';
    }
  }).catch((err) => {
    const record = memoryJobs.get(id);
    if (record) {
      record.state = 'failed';
      record.failedReason = err.message;
    }
  });

  return { id };
}

async function getVideoJobStatus(id) {
  if (isRedisQueueEnabled()) {
    const { Queue } = require('bullmq');
    const queue = new Queue(QUEUE_NAME, { connection: getClient() });
    const job = await queue.getJob(id);
    if (!job) return { status: 'not found', result: null };
    const state = await job.getState();
    return {
      status: state,
      result: job.returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }

  const record = memoryJobs.get(id);
  if (!record) return { status: 'not found', result: null };
  return {
    status: record.state,
    result: record.returnvalue,
    failedReason: record.failedReason,
  };
}

function setVideoProcessor(handler) {
  processor = handler;
}

async function startInlineWorker() {
  if (isRedisQueueEnabled()) {
    logger.info('[JobQueue] Redis queue enabled. Use npm run worker for dedicated workers.');
    return;
  }
  logger.info('[JobQueue] In-memory queue worker active in API process');
}

module.exports = {
  addVideoJob,
  getVideoJobStatus,
  setVideoProcessor,
  startInlineWorker,
  QUEUE_NAME,
  isRedisQueueEnabled,
};
