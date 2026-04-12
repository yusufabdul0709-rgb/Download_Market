'use strict';

const { fetchMetadata } = require('../utils/ytdlp');
const logger = require('../utils/logger');

/** Simple in-memory cache (no Redis needed) */
const _cache = new Map();
const CACHE_TTL = 300_000; // 5 minutes in ms

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
        acc.push({ quality: label, formatId: f.format_id, label });
      }
      return acc;
    }, [])
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

  // Add audio option
  formats.push({
    quality: '128kbps',
    formatId: 'audio',
    format: 'mp3',
    label: 'MP3 Audio',
  });

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
 * Results are cached in memory for 5 minutes.
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
async function getMediaPreview(url) {
  // Check cache
  const cached = _cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('[Preview] Cache hit');
    return cached.data;
  }

  logger.debug('[Preview] Fetching metadata via yt-dlp');
  const raw = await fetchMetadata(url);
  const preview = normaliseMetadata(raw);

  // Cache
  _cache.set(url, { data: preview, timestamp: Date.now() });

  // Auto-expire cache entries
  setTimeout(() => _cache.delete(url), CACHE_TTL);

  return preview;
}

module.exports = { getMediaPreview, normaliseMetadata };
