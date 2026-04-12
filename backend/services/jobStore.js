'use strict';

const { getClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

/** Redis key prefix for job metadata */
const KEY_PREFIX = 'job:';

/**
 * @typedef {object} JobRecord
 * @property {string} jobId
 * @property {string} url
 * @property {string} platform
 * @property {string} type
 * @property {'queued'|'processing'|'completed'|'failed'} status
 * @property {number} progress    0–100
 * @property {string|null} filePath
 * @property {string|null} downloadUrl
 * @property {string|null} error
 * @property {number} createdAt   Unix timestamp (ms)
 * @property {number} expiresAt   Unix timestamp (ms)
 */

/**
 * Create an initial job record in Redis.
 * @param {string} jobId
 * @param {object} data  { url, platform, type }
 * @returns {Promise<JobRecord>}
 */
async function createJob(jobId, { url, platform, type }) {
  const ttl = config.redis.jobTTL;
  const now = Date.now();

  /** @type {JobRecord} */
  const record = {
    jobId,
    url,
    platform,
    type,
    status: 'queued',
    progress: 0,
    filePath: null,
    downloadUrl: null,
    error: null,
    createdAt: now,
    expiresAt: now + ttl * 1000,
  };

  const redis = getClient();
  await redis.set(
    `${KEY_PREFIX}${jobId}`,
    JSON.stringify(record),
    'EX',
    ttl
  );

  logger.debug(`[JobStore] Created job ${jobId}`);
  return record;
}

/**
 * Retrieve a job record by ID.
 * @param {string} jobId
 * @returns {Promise<JobRecord|null>}
 */
async function getJob(jobId) {
  const redis = getClient();
  const raw = await redis.get(`${KEY_PREFIX}${jobId}`);
  if (!raw) return null;
  return JSON.parse(raw);
}

/**
 * Partially update a job record. Refreshes the TTL on every write.
 * @param {string} jobId
 * @param {Partial<JobRecord>} updates
 */
async function updateJob(jobId, updates) {
  const redis = getClient();
  const existing = await getJob(jobId);
  if (!existing) {
    logger.warn(`[JobStore] updateJob called for unknown jobId ${jobId}`);
    return;
  }

  const merged = { ...existing, ...updates };
  const ttl = config.redis.jobTTL;
  await redis.set(
    `${KEY_PREFIX}${jobId}`,
    JSON.stringify(merged),
    'EX',
    ttl
  );

  logger.debug(`[JobStore] Updated job ${jobId} → ${JSON.stringify(updates)}`);
}

/**
 * Delete a job record explicitly (e.g. after file is served).
 * @param {string} jobId
 */
async function deleteJob(jobId) {
  const redis = getClient();
  await redis.del(`${KEY_PREFIX}${jobId}`);
  logger.debug(`[JobStore] Deleted job ${jobId}`);
}

module.exports = { createJob, getJob, updateJob, deleteJob };
