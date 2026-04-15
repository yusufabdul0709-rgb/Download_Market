'use strict';

const { getMediaPreview } = require('../services/previewService');
const { getMediaData, smartUrlDetection } = require('../services/videoService');
const { validateUrl } = require('../utils/validator');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/preview
 *
 * Returns metadata (title, thumbnail, duration, available formats) for a URL.
 *
 * - YouTube / Facebook → routed through videoService (4-layer fallback chain)
 * - Instagram          → routed through previewService (yt-dlp based)
 *
 * Results are cached for 1 hour (videoService) or 5 min (previewService).
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

  // YouTube and Facebook → use the new 4-layer videoService
  if (platform === 'youtube' || platform === 'facebook') {
    const mediaData = await getMediaData(normalizedUrl);
    return res.json({
      success: true,
      platform,
      ...mediaData,
    });
  }

  // Instagram (and any other) → existing yt-dlp preview flow
  const preview = await getMediaPreview(normalizedUrl, platform);
  res.json({
    success: true,
    platform,
    ...preview,
  });
});

module.exports = { getPreview };

