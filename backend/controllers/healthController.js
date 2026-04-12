'use strict';

const { asyncHandler } = require('../utils/asyncHandler');
const config = require('../config');

/**
 * GET /api/health
 *
 * Returns system health status.
 */
const healthCheck = asyncHandler(async (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv,
    services: {
      api: { status: 'up' },
      storage: { status: 'in-memory' },
    },
  });
});

module.exports = { healthCheck };
