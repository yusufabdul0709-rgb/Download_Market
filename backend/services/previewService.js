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
        acc.push({ quality: label, formatId: f.format_id, label, format: 'mp4' });
      }
      return acc;
    }, [])
    .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

  // If no video formats found, add default options
  if (formats.length === 0) {
    formats.push(
      { quality: '720p', formatId: 'best', label: '720p', format: 'mp4' },
      { quality: '480p', formatId: 'best', label: '480p', format: 'mp4' },
      { quality: '360p', formatId: 'best', label: '360p', format: 'mp4' }
    );
  }

  // Add audio option
  formats.push({
    quality: '128kbps',
    formatId: 'audio',
    format: 'mp3',
    label: 'MP3 Audio',
  });

  return {
    title: raw.title || raw.fulltitle || 'Unknown Title',
    thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || null,
    duration: raw.duration || null,
    uploader: raw.uploader || raw.channel || raw.uploader_id || null,
    channel: raw.channel || raw.uploader || null,
    viewCount: raw.view_count || null,
    likeCount: raw.like_count || null,
    uploadDate: raw.upload_date || null,
    description: raw.description ? raw.description.substring(0, 200) : null,
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

  try {
    const raw = await fetchMetadata(url);
    const preview = normaliseMetadata(raw);

    // Cache
    _cache.set(url, { data: preview, timestamp: Date.now() });

    // Auto-expire cache entries
    setTimeout(() => _cache.delete(url), CACHE_TTL);

    return preview;
  } catch (err) {
    logger.error(`[Preview] yt-dlp failed: ${err.message}`);

    // Provide a more specific error message
    const message = err.message || '';

    if (message.includes('login') || message.includes('cookies') || message.includes('private')) {
      const error = new Error('This content is private or requires login. Please make sure the URL is publicly accessible.');
      error.statusCode = 403;
      error.code = 'PRIVATE_CONTENT';
      error.isOperational = true;
      throw error;
    }

    if (message.includes('not found') || message.includes('unavailable') || message.includes('404')) {
      const error = new Error('Content not found. The URL may have been deleted or is invalid.');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      error.isOperational = true;
      throw error;
    }

    if (message.includes('timed out') || message.includes('timeout')) {
      const error = new Error('Request timed out. The server took too long to respond. Please try again.');
      error.statusCode = 504;
      error.code = 'TIMEOUT';
      error.isOperational = true;
      throw error;
    }

    if (message.includes('Failed to start yt-dlp') || message.includes('ENOENT')) {
      const error = new Error('Download service is not available. Please ensure yt-dlp is installed on the server.');
      error.statusCode = 503;
      error.code = 'SERVICE_UNAVAILABLE';
      error.isOperational = true;
      throw error;
    }

    // Generic fallback
    const error = new Error(`Could not fetch media info: ${message.slice(-150) || 'Unknown error'}. Please check the URL and try again.`);
    error.statusCode = 500;
    error.code = 'FETCH_FAILED';
    error.isOperational = true;
    throw error;
  }
}

module.exports = { getMediaPreview, normaliseMetadata };
