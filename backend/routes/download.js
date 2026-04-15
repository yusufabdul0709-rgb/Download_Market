'use strict';

const { Router } = require('express');
const {
  submitDownload,
  getJobStatus,
  serveFile,
} = require('../controllers/downloadController');
const { downloadLimiter } = require('../middlewares/rateLimiter');
const getVideo = require('../services/downloader');

const router = Router();

/**
 * POST /api/download
 * Submit a new download job.
 */
router.post('/', downloadLimiter, submitDownload);

/**
 * POST /api/download/download
 * Fallback API aggregator endpoint (api1 -> api2 -> api3)
 * Added as a separate route so existing queue flow remains unchanged.
 */
router.post('/download', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL required' });
  }

  try {
    const result = await getVideo(url);
    return res.json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

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
