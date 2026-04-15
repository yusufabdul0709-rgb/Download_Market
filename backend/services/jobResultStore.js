'use strict';

const crypto = require('crypto');
const config = require('../config');
const { getClient } = require('../config/redis');
const logger = require('../utils/logger');

const memoryResultCache = new Map();
const inflightJobs = new Map();
const RESULT_TTL_SECONDS = parseInt(process.env.RESULT_CACHE_TTL_SECONDS, 10) || 20 * 60;
const INFLIGHT_TTL_SECONDS = parseInt(process.env.INFLIGHT_JOB_TTL_SECONDS, 10) || 10 * 60;

function toKey(url) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

function isRedisEnabled() {
  return Boolean(config.redis?.enabled);
}

async function getCachedResult(url) {
  const key = toKey(url);
  if (isRedisEnabled()) {
    try {
      const redis = getClient();
      const raw = await redis.get(`result:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      logger.warn('[JobResultStore] Redis getCachedResult failed', { message: err.message });
      return null;
    }
  }

  const existing = memoryResultCache.get(key);
  if (!existing) return null;
  if (Date.now() > existing.expiresAt) {
    memoryResultCache.delete(key);
    return null;
  }
  return existing.value;
}

async function setCachedResult(url, result, ttlSeconds = RESULT_TTL_SECONDS) {
  const key = toKey(url);
  if (isRedisEnabled()) {
    try {
      const redis = getClient();
      await redis.set(`result:${key}`, JSON.stringify(result), 'EX', ttlSeconds);
      return;
    } catch (err) {
      logger.warn('[JobResultStore] Redis setCachedResult failed', { message: err.message });
      return;
    }
  }

  memoryResultCache.set(key, {
    value: result,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

async function getInflightJobId(url) {
  const key = toKey(url);
  if (isRedisEnabled()) {
    try {
      const redis = getClient();
      return await redis.get(`inflight:${key}`);
    } catch (err) {
      logger.warn('[JobResultStore] Redis getInflightJobId failed', { message: err.message });
      return null;
    }
  }

  const existing = inflightJobs.get(key);
  if (!existing) return null;
  if (Date.now() > existing.expiresAt) {
    inflightJobs.delete(key);
    return null;
  }
  return existing.jobId;
}

async function setInflightJobId(url, jobId, ttlSeconds = INFLIGHT_TTL_SECONDS) {
  const key = toKey(url);
  if (isRedisEnabled()) {
    try {
      const redis = getClient();
      await redis.set(`inflight:${key}`, String(jobId), 'EX', ttlSeconds);
      return;
    } catch (err) {
      logger.warn('[JobResultStore] Redis setInflightJobId failed', { message: err.message });
      return;
    }
  }

  inflightJobs.set(key, {
    jobId: String(jobId),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

async function clearInflightJobId(url) {
  const key = toKey(url);
  if (isRedisEnabled()) {
    try {
      const redis = getClient();
      await redis.del(`inflight:${key}`);
      return;
    } catch (err) {
      logger.warn('[JobResultStore] Redis clearInflightJobId failed', { message: err.message });
      return;
    }
  }

  inflightJobs.delete(key);
}

module.exports = {
  getCachedResult,
  setCachedResult,
  getInflightJobId,
  setInflightJobId,
  clearInflightJobId,
};
