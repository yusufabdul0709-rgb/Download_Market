const { enqueueExtraction, getJobResult } = require('../services/queue.service');
const { getCachedResult, setCachedResult } = require('../services/cache.service');
const logger = require('../config/logger');

// Mapping internal error codes to user messages
const ERROR_MAP = {
  'UNSUPPORTED_PLATFORM': 'We do not support downloading from this platform.',
  'PRIVATE_CONTENT': 'This content is private or requires registration.',
  'RATE_LIMITED': 'Rate limit exceeded on the target platform. Try again soon.',
  'TIMEOUT': 'Operation timed out while extracting video details.',
  'INVALID_JSON': 'Failed to parse response from extraction engine.',
  'UNAVAILABLE': 'The media is unavailable, region-blocked, or deleted.',
  'INVALID_URL': 'The provided URL is malformed or invalid.',
  'FORBIDDEN_IP': 'Access to the specified hostname is blocked.',
  'EXTRACTION_FAILED': 'Could not extract media links from this content.'
};

async function handleDownloadRequest(req, res) {
  const { url: originalUrl, type = 'video' } = req.body;
  const { platform, parsedUrl } = req.platformDetails; // Setup by validateRequest.js
  const normalizedUrl = parsedUrl.href;

  const requestStartTime = Date.now();

  try {
    // 1. Check Redis Cache
    const cached = await getCachedResult(normalizedUrl);
    if (cached) {
      logger.info(`[Controller] Cache hit for ${normalizedUrl}`);
      return res.json({
        status: 'success',
        platform,
        type: cached.type || type,
        media: cached.media,
        cached: true
      });
    }

    logger.info(`[Controller] Enqueueing extraction for ${normalizedUrl}`);

    // 2. Enqueue Job
    const job = await enqueueExtraction(normalizedUrl, platform, type);

    // 3. Wait for Worker Result
    const result = await getJobResult(job);

    // 4. Cache and Return
    await setCachedResult(normalizedUrl, result);

    const duration = Date.now() - requestStartTime;
    logger.info(`[Controller] Extraction completed for ${normalizedUrl} in ${duration}ms`);

    return res.json({
      status: 'success',
      platform: result.platform,
      type: result.type,
      media: result.media,
      cached: false
    });

  } catch (err) {
    const code = err.message || 'EXTRACTION_FAILED';
    const cleanCode = ERROR_MAP[code] ? code : 'EXTRACTION_FAILED';

    logger.error(`[Controller] Extraction failed for ${normalizedUrl}: ${code}`);

    return res.status(cleanCode === 'RATE_LIMITED' || cleanCode === 'TIMEOUT' ? 503 : 400).json({
      status: 'error',
      code: cleanCode,
      message: ERROR_MAP[cleanCode] || 'An unexpected error occurred during extraction.'
    });
  }
}

module.exports = { handleDownloadRequest };
