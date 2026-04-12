'use strict';

const { Router } = require('express');
const {
  submitDownload,
  getJobStatus,
  serveFile,
} = require('../controllers/downloadController');
const { downloadLimiter } = require('../middlewares/rateLimiter');

const router = Router();

/**
 * POST /api/download
 * Submit a new download job.
 */
router.post('/', downloadLimiter, submitDownload);

/**
 * GET /api/download/file/:jobId/:filename
 * Stream the completed file to the client.
 * NOTE: This route MUST be defined BEFORE /:jobId so Express matches it first.
 */
router.get('/file/:jobId/:filename', serveFile);

/**
 * GET /api/download/:jobId
 * Poll the status of an existing job.
 */
router.get('/:jobId', getJobStatus);

module.exports = router;
