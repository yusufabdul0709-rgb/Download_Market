'use strict';

const { fetchMetadata } = require('../utils/ytdlp');
const { getClient } = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

const CACHE_PREFIX = 'meta:';
const CACHE_TTL = 300; // 5 minutes

/**
 * Normalise raw yt-dlp JSON metadata into a clean preview object.
 * @param {object} raw
 * @returns {object}
 */
function normaliseMetadata(raw) {
  const formats = (raw.formats || [])
    .filter((f) => f.vcodec && f.vcodec !== 'none' && f.height)
    .reduce((acc, f) => {
      const label = `${f.height}p`;
      // Keep only one entry per resolution (prefer the first encountered)
      if (!acc.find((x) => x.quality === label)) {
        acc.push({ quality: label, formatId: f.format_id });
      }
      return acc;
    }, [])
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

  return {
    title: raw.title || 'Unknown Title',
    thumbnail: raw.thumbnail || null,
    duration: raw.duration || null,
    uploader: raw.uploader || null,
    viewCount: raw.view_count || null,
    likeCount: raw.like_count || null,
    uploadDate: raw.upload_date || null,
    formats,
  };
}

/**
 * Fetch media preview / metadata.
 * Results are cached in Redis for CACHE_TTL seconds to avoid hammering yt-dlp.
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
async function getMediaPreview(url) {
  const redis = getClient();
  const cacheKey = `${CACHE_PREFIX}${Buffer.from(url).toString('base64')}`;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    logger.debug('[Preview] Cache hit');
    return JSON.parse(cached);
  }

  logger.debug('[Preview] Fetching metadata via yt-dlp');
  const raw = await fetchMetadata(url);
  const preview = normaliseMetadata(raw);

  // Cache the result
  await redis.set(cacheKey, JSON.stringify(preview), 'EX', CACHE_TTL);

  return preview;
}

module.exports = { getMediaPreview, normaliseMetadata };
