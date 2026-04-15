'use strict';

const { getMediaPreview } = require('../services/previewService');
const { validateUrl } = require('../utils/validator');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/preview
 *
 * Returns metadata (title, thumbnail, duration, available formats) for a URL.
 *
 * All platforms (YouTube, Facebook, Instagram) are routed through yt-dlp
 * via the unified previewService pipeline. No external API keys required.
 *
 * Results are cached for 5 min (previewService).
 */
const getPreview = asyncHandler(async (req, res) => {
  const { url } = req.body;

  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) {
    throw new AppError(urlCheck.error, 400, 'INVALID_URL');
  }

  const normalizedUrl = urlCheck.url.href;
  const platform = urlCheck.platform;

  logger.info(`[Preview] Fetching preview for ${normalizedUrl} (platform: ${platform})`);

  // All platforms → unified yt-dlp preview flow
  const preview = await getMediaPreview(normalizedUrl, platform);
  res.json({
    success: true,
    platform,
    ...preview,
  });
});

module.exports = { getPreview };

