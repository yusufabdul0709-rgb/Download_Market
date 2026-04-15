'use strict';

const { Router } = require('express');
const { healthCheck, proxyHealthCheck } = require('../controllers/healthController');

const router = Router();

/**
 * GET /api/health
 * Returns API and Redis health status.
 */
router.get('/', healthCheck);
router.get('/proxies', proxyHealthCheck);

module.exports = router;
