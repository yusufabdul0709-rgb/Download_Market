'use strict';

const { getClient } = require('../config/redis');
const { asyncHandler } = require('../utils/asyncHandler');
const config = require('../config');

/**
 * GET /api/health
 *
 * Returns system health status:
 *  - API server  (always "up" if this responds)
 *  - Redis       (ping/pong check)
 */
const healthCheck = asyncHandler(async (_req, res) => {
  let redisStatus = 'down';
  let redisLatencyMs = null;

  try {
    const redis = getClient();
    const t0 = Date.now();
    await redis.ping();
    redisLatencyMs = Date.now() - t0;
    redisStatus = 'up';
  } catch {
    redisStatus = 'down';
  }

  const allHealthy = redisStatus === 'up';

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
    services: {
      api: { status: 'up' },
      redis: {
        status: redisStatus,
        ...(redisLatencyMs !== null ? { latencyMs: redisLatencyMs } : {}),
      },
    },
  });
});

module.exports = { healthCheck };
