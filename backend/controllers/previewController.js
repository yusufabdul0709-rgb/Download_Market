'use strict';

const { getMediaPreview } = require('../services/previewService');
const { validateUrl } = require('../utils/validator');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const logger = require('../utils/logger');

/**
 * POST /api/preview
 *
 * Returns metadata (title, thumbnail, duration, available formats) for a URL
 * without starting a download. Results are cached in Redis for 5 minutes.
 */
const getPreview = asyncHandler(async (req, res) => {
  const { url } = req.body;

  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) {
    throw new AppError(urlCheck.error, 400, 'INVALID_URL');
  }

  logger.info(`[Preview] Fetching preview for ${urlCheck.url.href}`);

  const preview = await getMediaPreview(urlCheck.url.href, urlCheck.platform);

  res.json({
    success: true,
    platform: urlCheck.platform,
    ...preview,
  });
});

module.exports = { getPreview };
