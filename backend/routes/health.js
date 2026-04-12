'use strict';

const { Router } = require('express');
const { healthCheck } = require('../controllers/healthController');

const router = Router();

/**
 * GET /api/health
 * Returns API and Redis health status.
 */
router.get('/', healthCheck);

module.exports = router;
