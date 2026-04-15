'use strict';

const { fetchMetadataWithFallback } = require('../utils/ytdlp');
const { enqueuePreview } = require('./concurrencyQueue');
const logger = require('../utils/logger');
const cache = require('./previewCache');



/**
 * Normalise raw yt-dlp JSON metadata for Facebook content.
 */
function normaliseFacebookData(raw, url) {
  const isAudioOnly = url.includes('audio') || url.includes('podcast');
  
  // Facebook often has HD and SD formats
  // yt-dlp identifies them as 'hd' and 'sd' in some extractors or we pick by resolution
  const formats = (raw.formats || [])
    .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
    .slice(0, 5) // Just a few
    .map(f => ({
      quality: f.format_note || `${f.height}p` || 'HD',
      formatId: f.format_id,
      label: f.format_note === 'hd' ? 'HD Quality' : 'Standard Quality',
      format: 'mp4'
    }));

  if (formats.length === 0) {
    formats.push({ quality: 'HD', formatId: 'best', label: 'Highest Quality', format: 'mp4' });
  }

  // Add audio option
  formats.push({
    quality: '128kbps',
    formatId: 'audio',
    format: 'mp3',
    label: 'Extract MP3',
  });

  return {
    platform: 'facebook',
    type: url.includes('/reel') ? 'reel' : 'video',
    title: raw.title || raw.description?.slice(0, 100) || 'Facebook Content',
    thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || null,
    duration: raw.duration || null,
    formats,
  };
}

/**
 * Normalise raw yt-dlp JSON metadata for YouTube content.
 */
function normaliseYouTubeData(raw, url) {
  const isShorts = url.includes('/shorts/') || (raw.duration && raw.duration < 62);

  // Build quality-sorted format list from yt-dlp output
  const seen = new Set();
  const formats = (raw.formats || [])
    .filter(f => {
      // Only keep formats with both video+audio, or standalone audio
      if (!f.url) return false;
      // Prefer pre-merged (has both video and audio codecs)
      const hasVideo = f.vcodec && f.vcodec !== 'none';
      const hasAudio = f.acodec && f.acodec !== 'none';
      return (hasVideo && hasAudio) || (!hasVideo && hasAudio);
    })
    .map(f => {
      const hasVideo = f.vcodec && f.vcodec !== 'none';
      const label = hasVideo
        ? (f.format_note || `${f.height || '?'}p`)
        : 'Audio Only';
      return {
        quality: label,
        formatId: f.format_id,
        label: hasVideo ? `${label} (${f.ext || 'mp4'})` : `Audio (${f.ext || 'm4a'})`,
        format: hasVideo ? 'mp4' : f.ext || 'm4a',
        height: f.height || 0,
        type: hasVideo ? 'video' : 'audio',
      };
    })
    // Deduplicate by quality label
    .filter(f => {
      const key = `${f.quality}-${f.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    // Sort: highest resolution first for video, audio at end
    .sort((a, b) => {
      if (a.type === 'audio' && b.type !== 'audio') return 1;
      if (a.type !== 'audio' && b.type === 'audio') return -1;
      return (b.height || 0) - (a.height || 0);
    })
    .slice(0, 6);

  // Always add a "best" option at the top and an audio extraction option
  const result = [
    { quality: 'Best', formatId: 'best', label: 'Best Quality (MP4)', format: 'mp4' },
    ...formats,
  ];

  // Add MP3 extraction if not already present
  if (!formats.some(f => f.type === 'audio')) {
    result.push({ quality: '128kbps', formatId: 'audio', format: 'mp3', label: 'Extract MP3' });
  }

  return {
    platform: 'youtube',
    type: isShorts ? 'shorts' : 'video',
    title: raw.title || raw.fulltitle || 'YouTube Video',
    thumbnail: raw.thumbnail || raw.thumbnails?.[raw.thumbnails.length - 1]?.url || null,
    duration: raw.duration || null,
    formats: result,
  };
}

/**
 * Normalise raw yt-dlp JSON metadata into a clean preview object for Instagram.
 * yt-dlp natively supports Instagram posts, reels, and stories.
 *
 * @param {object} raw   yt-dlp JSON output
 * @param {string} url   Original URL
 * @returns {object}
 */
function normaliseInstagramData(raw, url) {
  const isReel = url.includes('/reel') || url.includes('/reels');
  const isCarousel = Array.isArray(raw.entries) && raw.entries.length > 1;

  // Build media list
  let media = [];
  if (isCarousel) {
    media = raw.entries.map((entry) => ({
      type: entry.ext === 'jpg' || entry.ext === 'png' || entry.ext === 'webp' ? 'image' : 'video',
      url: entry.url || (entry.formats && entry.formats[0]?.url) || '',
      thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || '',
    }));
  } else {
    // Single post/reel — check if it has video formats
    const hasVideo = (raw.formats || []).some((f) => f.vcodec && f.vcodec !== 'none');
    const bestUrl = raw.url || (raw.formats && raw.formats[0]?.url) || '';
    media.push({
      type: hasVideo ? 'video' : 'image',
      url: bestUrl,
      thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || bestUrl,
    });
  }

  // Determine type
  let type = 'video';
  if (isCarousel) {
    type = 'carousel';
  } else if (media.length === 1 && media[0].type === 'image') {
    type = 'image';
  } else if (isReel) {
    type = 'video';
  }

  // Build available formats
  const formats = [
    {
      formatId: 'best',
      label: `Download ${type === 'carousel' ? 'All (Zip)' : type === 'video' ? 'Video' : 'Image'}`,
      format: type === 'carousel' ? 'zip' : type === 'video' ? 'mp4' : 'jpg',
    },
  ];

  // Add audio extraction option for video content
  if (type !== 'image') {
    formats.push({ formatId: 'audio', label: 'Extract Audio', format: 'mp3' });
  }

  return {
    platform: 'instagram',
    type,
    title: raw.title || raw.description?.slice(0, 100) || 'Instagram Post',
    thumbnail: raw.thumbnail || raw.thumbnails?.[0]?.url || null,
    duration: raw.duration || null,
    media,
    formats,
  };
}

/**
 * Fetch Instagram Data using yt-dlp (replaces broken instagram-url-direct package).
 * @param {string} url
 * @returns {object}
 */
async function fetchInstagramData(url) {
  try {
    const { data: raw } = await fetchMetadataWithFallback(url);
    return normaliseInstagramData(raw, url);
  } catch (err) {
    logger.error(`[Preview] Instagram yt-dlp extraction failed: ${err.message}`);

    // Detect login/cookie requirement errors
    const msg = (err.message || '').toLowerCase();
    let userMessage = 'Video not found';
    let statusCode = 404;

    if (msg.includes('cookies') || msg.includes('logged-in') || msg.includes('login') || msg.includes('authentication')) {
      userMessage = 'Private or restricted content';
      statusCode = 401;
    } else if (msg.includes('not found') || msg.includes('404')) {
      userMessage = 'Video not found';
    } else if (msg.includes('rate') || msg.includes('429') || msg.includes('too many')) {
      userMessage = 'Platform blocked request';
      statusCode = 429;
    }

    const error = new Error(userMessage);
    error.statusCode = statusCode;
    error.isOperational = true;
    error.source = 'api1/api2';
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
  // Use the Cache Service for both TTL caching and active request deduplication
  return cache.getOrFetch(url, async () => {
    logger.debug(`[Preview] Queueing fresh metadata fetch for ${platform}`);

    // Run through the concurrency-limited preview queue
    return enqueuePreview(async () => {
      try {
        let preview;
        let source = 'api1';
        if (platform === 'instagram') {
          preview = await fetchInstagramData(url);
        } else if (platform === 'facebook') {
          const metadata = await fetchMetadataWithFallback(url);
          const raw = metadata.data;
          source = metadata.source;
          preview = normaliseFacebookData(raw, url);
        } else if (platform === 'youtube') {
          const metadata = await fetchMetadataWithFallback(url);
          const raw = metadata.data;
          source = metadata.source;
          preview = normaliseYouTubeData(raw, url);
        } else {
          throw new Error(`Platform ${platform} is not supported.`);
        }
        return { ...preview, source };
      } catch (err) {
      if (err.isOperational) throw err;
      
      logger.error(`[Preview] yt-dlp / extractor failed: ${err.message}`);

      // Provide a more specific error message
      const message = err.message || '';
      const lowerMsg = message.toLowerCase();

      // ── Unavailable / deleted / invalid ─────────────────────────────────
      if (lowerMsg.includes('not found') || lowerMsg.includes('unavailable') || lowerMsg.includes('404')) {
        const error = new Error('Video not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        error.isOperational = true;
        error.source = 'api1/api2';
        throw error;
      }

      // ── Actual private / login-only content ────────────────────────────
      if (
        lowerMsg.includes('private video') ||
        lowerMsg.includes('this video is private') ||
        lowerMsg.includes('registered users') ||
        lowerMsg.includes('cookies-to-yt-dlp') ||
        lowerMsg.includes('sign in to confirm you\'ve been granted access') ||
        (lowerMsg.includes('sign in') && !lowerMsg.includes('bot'))
      ) {
        let text = 'Private or restricted content';
        const error = new Error(text);
        error.statusCode = 403;
        error.code = 'PRIVATE_CONTENT';
        error.isOperational = true;
        error.source = 'api1/api2';
        throw error;
      }

      // ── Bot protection / rate limiting ─────────────────────────────────
      if (lowerMsg.includes('bot') || lowerMsg.includes('429') || lowerMsg.includes('too many requests')) {
        const error = new Error('Platform blocked request');
        error.statusCode = 429;
        error.code = 'RATE_LIMITED';
        error.isOperational = true;
        error.source = 'api1/api2';
        throw error;
      }

      // ── Timeout ────────────────────────────────────────────────────────
      if (lowerMsg.includes('timed out') || lowerMsg.includes('timeout')) {
        const error = new Error('Server busy, try again later');
        error.statusCode = 504;
        error.code = 'TIMEOUT';
        error.isOperational = true;
        error.source = 'api1/api2';
        throw error;
      }

      // ── Missing yt-dlp binary ──────────────────────────────────────────
      if (lowerMsg.includes('failed to start yt-dlp') || lowerMsg.includes('enoent')) {
        const error = new Error('Server busy, try again later');
        error.statusCode = 503;
        error.code = 'SERVICE_UNAVAILABLE';
        error.isOperational = true;
        error.source = 'api1/api2';
        throw error;
      }

      // ── Extractor / Unhandled Errors ───────────────────────────────────
      if (lowerMsg.includes('issues?q=') || lowerMsg.includes('unsupported') || lowerMsg.includes('extractorerror')) {
        let userMsg = 'Platform blocked request';
        const error = new Error(userMsg);
        error.statusCode = 400;
        error.code = 'EXTRACTOR_ERROR';
        error.isOperational = true;
        error.source = 'api1/api2';
        throw error;
      }

      // ── Generic fallback ───────────────────────────────────────────────
      const error = new Error('Server busy, try again later');
      error.statusCode = 500;
      error.code = 'FETCH_FAILED';
      error.isOperational = true;
      error.source = 'api1/api2';
      throw error;
      }
    });
  });
}

module.exports = { getMediaPreview, fetchInstagramData };
