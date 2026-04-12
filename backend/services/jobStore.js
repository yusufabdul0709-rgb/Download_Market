'use strict';

const logger = require('../utils/logger');

/** In-memory job store — no Redis needed */
const _jobs = new Map();

/** Auto-expire jobs after TTL */
const config = require('../config');

/**
 * Create an initial job record.
 * @param {string} jobId
 * @param {object} data  { url, platform, type }
 * @returns {object} JobRecord
 */
function createJob(jobId, { url, platform, type }) {
  const ttl = config.fileTTLSeconds;
  const now = Date.now();

  const record = {
    jobId,
    url,
    platform,
    type,
    status: 'queued',
    progress: 0,
    filePath: null,
    downloadUrl: null,
    filename: null,
    error: null,
    createdAt: now,
    expiresAt: now + ttl * 1000,
  };

  _jobs.set(jobId, record);

  // Auto-delete after TTL
  setTimeout(() => {
    _jobs.delete(jobId);
    logger.debug(`[JobStore] Expired job ${jobId}`);
  }, ttl * 1000);

  logger.debug(`[JobStore] Created job ${jobId}`);
  return record;
}

/**
 * Retrieve a job record by ID.
 * @param {string} jobId
 * @returns {object|null}
 */
function getJob(jobId) {
  return _jobs.get(jobId) || null;
}

/**
 * Partially update a job record.
 * @param {string} jobId
 * @param {object} updates
 */
function updateJob(jobId, updates) {
  const existing = _jobs.get(jobId);
  if (!existing) {
    logger.warn(`[JobStore] updateJob called for unknown jobId ${jobId}`);
    return;
  }

  const merged = { ...existing, ...updates };
  _jobs.set(jobId, merged);
  logger.debug(`[JobStore] Updated job ${jobId} → status=${merged.status}`);
}

/**
 * Delete a job record.
 * @param {string} jobId
 */
function deleteJob(jobId) {
  _jobs.delete(jobId);
  logger.debug(`[JobStore] Deleted job ${jobId}`);
}

module.exports = { createJob, getJob, updateJob, deleteJob };
