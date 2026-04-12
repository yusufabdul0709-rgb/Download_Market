'use strict';

const { Router } = require('express');
const { getPreview } = require('../controllers/previewController');
const { previewLimiter } = require('../middlewares/rateLimiter');

const router = Router();

/**
 * POST /api/preview
 * Return media metadata without starting a download.
 */
router.post('/', previewLimiter, getPreview);

module.exports = router;
