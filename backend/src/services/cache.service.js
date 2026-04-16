const redis = require('../config/redis');
const logger = require('../config/logger');

const CACHE_TTL_SECONDS = 600; // 10 minutes

async function getCachedResult(url) {
  try {
    const key = `ytcache:${url}`;
    const result = await redis.get(key);
    if (result) {
      return JSON.parse(result);
    }
    return null;
  } catch (err) {
    logger.error('[Cache] Redis get failed', err);
    return null; // Graceful degradation
  }
}

async function setCachedResult(url, data) {
  try {
    const key = `ytcache:${url}`;
    await redis.setex(key, CACHE_TTL_SECONDS, JSON.stringify(data));
  } catch (err) {
    logger.error('[Cache] Redis set failed', err);
  }
}

module.exports = { getCachedResult, setCachedResult };
