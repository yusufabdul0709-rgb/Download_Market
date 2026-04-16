'use strict';

const { Router } = require('express');
const {
  submitDownload,
  getJobStatus,
  serveFile,
} = require('../controllers/downloadController');
const { downloadLimiter } = require('../middlewares/rateLimiter');
const getVideo = require('../services/downloader');
const { validateUrl } = require('../utils/validator');
const { addVideoJob, getVideoJobStatus } = require('../queue/jobQueue');
const YTDlpWrap = require('yt-dlp-wrap').default;
const {
  getCachedResult,
  getInflightJobId,
  setInflightJobId,
} = require('../services/jobResultStore');

const router = Router();
const ytDlp = new YTDlpWrap();

/**
 * POST /api/download
 * Submit a new download job.
 */
router.post('/', downloadLimiter, submitDownload);

/**
 * GET /api/download?url=<video_url>
 * Direct metadata/download URL extractor using yt-dlp-wrap.
 */
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const videoInfo = await ytDlp.getVideoInfo(url);
    const title = videoInfo?.title || 'video';
    const downloadUrl =
      videoInfo?.url
      || (Array.isArray(videoInfo?.formats) && videoInfo.formats.length > 0
        ? videoInfo.formats[videoInfo.formats.length - 1]?.url
        : null);

    if (!downloadUrl) {
      return res.status(500).json({ error: 'Could not extract download URL' });
    }

    return res.json({
      title,
      downloadUrl,
      thumbnail: videoInfo?.thumbnail || null,
      duration: videoInfo?.duration || null,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch video info',
      details: err.message,
    });
  }
});

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
 * POST /api/download/queue
 * Queue-first endpoint for scalable background processing.
 */
router.post('/queue', downloadLimiter, async (req, res) => {
  const { url } = req.body || {};
  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) {
    return res.status(400).json({ success: false, message: urlCheck.error || 'Invalid URL' });
  }

  const normalizedUrl = urlCheck.url.href;
  const cached = await getCachedResult(normalizedUrl);
  if (cached) {
    return res.json({
      success: true,
      cached: true,
      status: 'completed',
      result: cached,
    });
  }

  const inflightJobId = await getInflightJobId(normalizedUrl);
  if (inflightJobId) {
    return res.status(202).json({
      success: true,
      deduplicated: true,
      status: 'queued',
      jobId: inflightJobId,
    });
  }

  const job = await addVideoJob({ url: normalizedUrl });
  await setInflightJobId(normalizedUrl, job.id);

  return res.status(202).json({
    success: true,
    status: 'queued',
    jobId: job.id,
  });
});

/**
 * GET /api/download/status/:id
 * Poll queue-job status.
 */
router.get('/status/:id', async (req, res) => {
  const status = await getVideoJobStatus(req.params.id);
  return res.json(status);
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
