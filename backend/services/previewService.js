'use strict';

const { fetchMetadata } = require('../utils/ytdlp');
const { instagramGetUrl } = require('instagram-url-direct');
const { enqueuePreview } = require('./concurrencyQueue');
const logger = require('../utils/logger');

/** Simple in-memory cache (no Redis needed) */
const _cache = new Map();
const CACHE_TTL = 300_000; // 5 minutes in ms

/**
 * Normalise raw yt-dlp JSON metadata into a clean preview object for YouTube.
 * @param {object} raw
 * @param {string} url
 * @returns {object}
 */
function normaliseYouTubeData(raw, url) {
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

  const isShorts = url.includes('/shorts/');

  return {
    platform: 'youtube',
    type: isShorts ? 'short' : 'video',
    title: raw.title || raw.fulltitle || 'YouTube Content',
    thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || null,
    duration: raw.duration || null,
    formats,
    ...(isShorts ? { media: [{ url }] } : {}) // Case 2 requirement
  };
}

/**
 * Fetch Instagram Data.
 * @param {string} url
 * @returns {object}
 */
async function fetchInstagramData(url) {
  try {
    const raw = await instagramGetUrl(url);
    if (!raw.url_list || raw.url_list.length === 0) {
      throw new Error('No media found in this Instagram post.');
    }

    const { post_info, media_details } = raw;
    const media = media_details.map(m => ({
      type: m.type,
      url: m.url,
      thumbnail: m.url // Instagram returns direct streams, image streams act as thumbnails
    }));

    // Determine type
    let type = 'video';
    if (media.length > 1) {
      type = 'carousel';
    } else if (media.length === 1 && media[0].type === 'image') {
      type = 'image';
    } else {
      type = 'video'; // defaults to reel/video
    }

    return {
      platform: 'instagram',
      type,
      title: post_info?.caption || 'Instagram Post',
      media,
      formats: [
        { formatId: 'direct', label: `Download ${type === 'carousel' ? 'All (Zip)' : type === 'video' ? 'Video' : 'Image'}`, format: type === 'carousel' ? 'zip' : type === 'video' ? 'mp4' : 'jpg' },
        ...(type !== 'image' ? [{ formatId: 'audio', label: 'Extract Audio', format: 'mp3' }] : [])
      ]
    };
  } catch (err) {
    logger.error(`[Preview] instagramGetUrl failed: ${err.message}`);
    const error = new Error('Could not fetch Instagram media. The post might be private or invalid.');
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }
}


/**
 * Fetch media preview / metadata.
 * Results are cached in memory for 5 minutes.
 * Requests are queued through the preview concurrency limiter.
 *
 * @param {string} url
 * @param {string} platform
 * @returns {Promise<object>}
 */
async function getMediaPreview(url, platform) {
  // Check cache first (before entering the queue)
  const cached = _cache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('[Preview] Cache hit');
    return cached.data;
  }

  logger.debug(`[Preview] Fetching metadata for ${platform} (queued)`);

  // Run through the concurrency-limited preview queue
  return enqueuePreview(async () => {
    // Double-check cache (another request may have populated it while we waited)
    const cached2 = _cache.get(url);
    if (cached2 && Date.now() - cached2.timestamp < CACHE_TTL) {
      logger.debug('[Preview] Cache hit (after queue wait)');
      return cached2.data;
    }

    try {
      let preview;
      if (platform === 'instagram') {
        preview = await fetchInstagramData(url);
      } else {
        const raw = await fetchMetadata(url);
        preview = normaliseYouTubeData(raw, url);
      }

      // Cache
      _cache.set(url, { data: preview, timestamp: Date.now() });

      // Auto-expire cache entries
      setTimeout(() => _cache.delete(url), CACHE_TTL);

      return preview;
    } catch (err) {
      if (err.isOperational) throw err;
      
      logger.error(`[Preview] yt-dlp / extractor failed: ${err.message}`);

      // Provide a more specific error message
      const message = err.message || '';
      const lowerMsg = message.toLowerCase();

      // ── Unavailable / deleted / invalid ─────────────────────────────────
      if (lowerMsg.includes('not found') || lowerMsg.includes('unavailable') || lowerMsg.includes('404')) {
        const error = new Error('Content not found. The URL may have been deleted or is invalid.');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        error.isOperational = true;
        throw error;
      }

      // ── Actual private / login-only content ────────────────────────────
      if (
        lowerMsg.includes('private video') ||
        lowerMsg.includes('this video is private') ||
        lowerMsg.includes('sign in to confirm you\'ve been granted access') ||
        (lowerMsg.includes('sign in') && !lowerMsg.includes('bot'))
      ) {
        const error = new Error('This content is private or age-restricted. Please make sure the URL is publicly accessible.');
        error.statusCode = 403;
        error.code = 'PRIVATE_CONTENT';
        error.isOperational = true;
        throw error;
      }

      // ── Bot protection / rate limiting ─────────────────────────────────
      if (lowerMsg.includes('bot') || lowerMsg.includes('429') || lowerMsg.includes('too many requests')) {
        const error = new Error(
          'Service is temporarily blocking requests due to anti-bot protection. Please try again later.'
        );
        error.statusCode = 429;
        error.code = 'RATE_LIMITED';
        error.isOperational = true;
        throw error;
      }

      // ── Timeout ────────────────────────────────────────────────────────
      if (lowerMsg.includes('timed out') || lowerMsg.includes('timeout')) {
        const error = new Error('Request timed out. The server took too long to respond. Please try again.');
        error.statusCode = 504;
        error.code = 'TIMEOUT';
        error.isOperational = true;
        throw error;
      }

      // ── Missing yt-dlp binary ──────────────────────────────────────────
      if (lowerMsg.includes('failed to start yt-dlp') || lowerMsg.includes('enoent')) {
        const error = new Error('Download service is not available. Please ensure dependencies are configured.');
        error.statusCode = 503;
        error.code = 'SERVICE_UNAVAILABLE';
        error.isOperational = true;
        throw error;
      }

      // ── Generic fallback ───────────────────────────────────────────────
      const error = new Error(`Could not fetch media info: ${message.slice(-150) || 'Unknown error'}. Please check the URL and try again.`);
      error.statusCode = 500;
      error.code = 'FETCH_FAILED';
      error.isOperational = true;
      throw error;
    }
  });
}

module.exports = { getMediaPreview, normaliseYouTubeData: normaliseYouTubeData, fetchInstagramData };
