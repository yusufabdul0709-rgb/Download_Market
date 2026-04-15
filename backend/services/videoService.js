'use strict';

const crypto = require('crypto');
const axios = require('axios');
const axiosRetry = require('axios-retry').default || require('axios-retry');
const config = require('../config');
const logger = require('../utils/logger');

// ── Axios retry setup ─────────────────────────────────────────────────────────
const apiClient = axios.create({ timeout: 8000 });
axiosRetry(apiClient, {
  retries: 3,
  retryDelay: (retryCount) => {
    const delay = Math.pow(2, retryCount) * 500;
    const jitter = Math.random() * 500;
    return delay + jitter;
  },
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429
    );
  },
});

// ── Redis cache helper (graceful fallback to in-memory) ───────────────────────

/** In-memory fallback cache when Redis is unavailable */
const _memoryCache = new Map();

/**
 * Get a lazy Redis client, or null if Redis is disabled / unavailable.
 */
function getRedis() {
  if (!config.redis?.enabled) return null;
  try {
    const { getClient } = require('../config/redis');
    return getClient();
  } catch {
    return null;
  }
}

async function cacheGet(key) {
  const redis = getRedis();
  if (redis) {
    try {
      const val = await redis.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      logger.warn(`[VideoService] Redis GET failed: ${err.message}`);
    }
  }
  // In-memory fallback
  const entry = _memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    _memoryCache.delete(key);
    return null;
  }
  return entry.data;
}

async function cacheSet(key, data, ttlSeconds = 3600) {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
      return;
    } catch (err) {
      logger.warn(`[VideoService] Redis SET failed: ${err.message}`);
    }
  }
  // In-memory fallback
  _memoryCache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  setTimeout(() => _memoryCache.delete(key), ttlSeconds * 1000);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashUrl(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Smart URL Detection & Normalization
 */
function smartUrlDetection(rawUrl) {
  try {
    const parsed = new URL(rawUrl);

    // YouTube
    if (parsed.hostname.includes('youtube') || parsed.hostname.includes('youtu.be')) {
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        return { platform: 'youtube', normalizedUrl: `https://www.youtube.com/watch?v=${shortsMatch[1]}` };
      }
      // Remove tracking params
      parsed.searchParams.delete('si');
      parsed.searchParams.delete('feature');
      parsed.searchParams.delete('pp');
      return { platform: 'youtube', normalizedUrl: parsed.href };
    }

    // Facebook
    if (parsed.hostname.includes('facebook') || parsed.hostname.includes('fb.watch')) {
      parsed.searchParams.delete('mibextid');
      parsed.searchParams.delete('__tn__');
      return { platform: 'facebook', normalizedUrl: parsed.href };
    }

    return null;
  } catch {
    return null;
  }
}

// ── Provider implementations ──────────────────────────────────────────────────

/**
 * Layer 1 — Apify
 */
async function fetchWithApify(url, platform) {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) throw new Error('APIFY_API_KEY not configured');

  const actorId = platform === 'youtube'
    ? 'bernardo~youtube-scraper'
    : 'apify~facebook-posts-scraper';

  const endpoint = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apiKey}`;

  logger.info(`[VideoService:Apify] Calling actor ${actorId}`);
  const response = await apiClient.post(
    endpoint,
    {
      startUrls: [{ url }],
      maxItems: 1,
      proxyConfiguration: { useApifyProxy: true },
    },
    { timeout: 8000 }
  );

  const items = response.data;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Apify returned no results');
  }

  const data = items[0];
  const download_links = [];
  let requiresMerge = false;

  if (platform === 'youtube') {
    if (data.formats && data.formats.length) {
      for (const f of data.formats) {
        const ql = f.qualityLabel || f.quality || '';
        if (parseInt(ql) >= 1080) requiresMerge = true;
        download_links.push({
          quality: ql || 'Unknown',
          url: f.url,
          type: f.hasAudio === false ? 'video_only' : 'video',
        });
      }
    } else if (data.url) {
      download_links.push({ quality: 'Best', url: data.url, type: 'video' });
    }
  } else {
    // Facebook
    if (data.videoUrl) download_links.push({ quality: 'SD', url: data.videoUrl, type: 'video' });
    if (data.videoUrlHd) download_links.push({ quality: 'HD', url: data.videoUrlHd, type: 'video' });
    if (download_links.length === 0 && data.videoPlaybackUrl) {
      download_links.push({ quality: 'SD', url: data.videoPlaybackUrl, type: 'video' });
    }
  }

  if (download_links.length === 0) throw new Error('Apify: no download links extracted');

  return {
    title: data.title || data.text?.slice(0, 100) || 'Video',
    duration: data.duration || 0,
    thumbnail_url: data.thumbnailUrl || data.thumbnail || '',
    source: platform,
    download_links,
    requiresMerge,
    provider_used: 'Apify',
    served_from_cache: false,
  };
}

/**
 * Layer 2 — ZenRows
 */
async function fetchWithZenRows(url, platform) {
  const apiKey = process.env.ZENROWS_API_KEY;
  if (!apiKey) throw new Error('ZENROWS_API_KEY not configured');

  logger.info('[VideoService:ZenRows] Fetching page content');
  const response = await apiClient.get('https://api.zenrows.com/v1/', {
    params: {
      apikey: apiKey,
      url,
      js_render: 'true',
      antibot: 'true',
      premium_proxy: 'true',
    },
    timeout: 8000,
  });

  const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  if (!html || html.length < 100) throw new Error('ZenRows returned empty/short content');

  // Extract video URLs from rendered HTML
  const download_links = [];
  const videoMatches = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi) || [];
  const uniqueUrls = [...new Set(videoMatches)].slice(0, 3);

  for (const vUrl of uniqueUrls) {
    download_links.push({ quality: 'HD', url: vUrl, type: 'video' });
  }

  // Try og:video meta tag
  if (download_links.length === 0) {
    const ogVideo = html.match(/property="og:video(?::url)?"\s+content="([^"]+)"/i);
    if (ogVideo) download_links.push({ quality: 'HD', url: ogVideo[1], type: 'video' });
  }

  if (download_links.length === 0) throw new Error('ZenRows: no video URLs found in page');

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i);
  const title = ogTitle?.[1] || titleMatch?.[1] || 'Video';

  // Extract thumbnail
  const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i);

  return {
    title,
    duration: 0,
    thumbnail_url: ogImage?.[1] || '',
    source: platform,
    download_links,
    requiresMerge: false,
    provider_used: 'ZenRows',
    served_from_cache: false,
  };
}

/**
 * Layer 3 — ScrapingBee
 */
async function fetchWithScrapingBee(url, platform) {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;
  if (!apiKey) throw new Error('SCRAPINGBEE_API_KEY not configured');

  logger.info('[VideoService:ScrapingBee] Fetching via stealth proxy');
  const response = await apiClient.get('https://app.scrapingbee.com/api/v1/', {
    params: {
      api_key: apiKey,
      url,
      render_js: 'true',
      stealth_proxy: 'true',
    },
    timeout: 8000,
  });

  const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
  if (!html || html.length < 100) throw new Error('ScrapingBee returned empty content');

  const download_links = [];
  const videoMatches = html.match(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi) || [];
  const uniqueUrls = [...new Set(videoMatches)].slice(0, 3);

  for (const vUrl of uniqueUrls) {
    download_links.push({ quality: 'HD', url: vUrl, type: 'video' });
  }

  if (download_links.length === 0) {
    const ogVideo = html.match(/property="og:video(?::url)?"\s+content="([^"]+)"/i);
    if (ogVideo) download_links.push({ quality: 'HD', url: ogVideo[1], type: 'video' });
  }

  if (download_links.length === 0) throw new Error('ScrapingBee: no video URLs found');

  const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
  const ogTitle = html.match(/property="og:title"\s+content="([^"]+)"/i);
  const ogImage = html.match(/property="og:image"\s+content="([^"]+)"/i);

  return {
    title: ogTitle?.[1] || titleMatch?.[1] || 'Video',
    duration: 0,
    thumbnail_url: ogImage?.[1] || '',
    source: platform,
    download_links,
    requiresMerge: false,
    provider_used: 'ScrapingBee',
    served_from_cache: false,
  };
}

/**
 * Layer 4 — RapidAPI
 */
async function fetchWithRapidAPI(url, platform) {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) throw new Error('RAPIDAPI_KEY not configured');

  const host =
    platform === 'youtube'
      ? 'yt-api.p.rapidapi.com'
      : 'facebook-reel-and-video-downloader.p.rapidapi.com';

  logger.info(`[VideoService:RapidAPI] Calling ${host}`);

  let requestUrl, params;
  if (platform === 'youtube') {
    // Extract video ID
    const parsed = new URL(url);
    let videoId = parsed.searchParams.get('v');
    if (!videoId) {
      const pathMatch = parsed.pathname.match(/^\/([a-zA-Z0-9_-]{11})$/);
      if (pathMatch) videoId = pathMatch[1];
    }
    requestUrl = `https://${host}/dl`;
    params = { id: videoId || url };
  } else {
    requestUrl = `https://${host}/app/main.php`;
    params = { url };
  }

  const response = await apiClient.get(requestUrl, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': host,
    },
    params,
    timeout: 8000,
  });

  const data = response.data;
  if (!data || data.error) throw new Error(`RapidAPI error: ${data?.message || 'Unknown'}`);

  const download_links = [];

  if (platform === 'youtube') {
    // yt-api format
    const formats = data.formats || data.adaptiveFormats || [];
    for (const f of formats.slice(0, 5)) {
      download_links.push({
        quality: f.qualityLabel || f.quality || 'HD',
        url: f.url,
        type: f.mimeType?.includes('audio') ? 'audio' : 'video',
      });
    }
    if (download_links.length === 0 && data.link) {
      download_links.push({ quality: 'Best', url: data.link, type: 'video' });
    }
  } else {
    // FB downloader format
    const links = data.links || data.urls || [];
    if (Array.isArray(links)) {
      for (const l of links) {
        download_links.push({
          quality: l.quality || 'HD',
          url: l.url || l.link,
          type: 'video',
        });
      }
    }
    if (download_links.length === 0 && data.url) {
      download_links.push({ quality: 'HD', url: data.url, type: 'video' });
    }
  }

  if (download_links.length === 0) throw new Error('RapidAPI: no download links extracted');

  return {
    title: data.title || 'Video',
    duration: data.lengthSeconds || data.duration || 0,
    thumbnail_url: data.thumbnail || data.thumbnails?.[0]?.url || '',
    source: platform,
    download_links,
    requiresMerge: false,
    provider_used: 'RapidAPI',
    served_from_cache: false,
  };
}

// ── Main orchestrator ─────────────────────────────────────────────────────────

const FALLBACK_CHAIN = [
  { name: 'Apify',       fn: fetchWithApify },
  { name: 'ZenRows',     fn: fetchWithZenRows },
  { name: 'ScrapingBee', fn: fetchWithScrapingBee },
  { name: 'RapidAPI',    fn: fetchWithRapidAPI },
];

/**
 * Fetch media metadata + download links.
 * Tries each provider in sequence until one succeeds.
 * Results are cached for 1 hour in Redis (or in-memory fallback).
 *
 * @param {string} rawUrl
 * @returns {Promise<object>}
 */
async function getMediaData(rawUrl) {
  const detection = smartUrlDetection(rawUrl);
  if (!detection) {
    throw new Error('Unsupported URL. Only YouTube and Facebook URLs are supported.');
  }

  const { platform, normalizedUrl } = detection;
  const cacheKey = `vid:${hashUrl(normalizedUrl)}`;

  // 1. Check cache
  const cached = await cacheGet(cacheKey);
  if (cached) {
    logger.info(`[VideoService] Cache HIT for ${normalizedUrl}`);
    return { ...cached, served_from_cache: true };
  }

  // 2. Try each provider in sequence
  let lastError = null;
  for (const provider of FALLBACK_CHAIN) {
    try {
      logger.info(`[VideoService] Trying ${provider.name} for ${normalizedUrl}`);
      const result = await provider.fn(normalizedUrl, platform);

      // Cache successful result (1 hour)
      await cacheSet(cacheKey, result, 3600);

      logger.info(`[VideoService] SUCCESS via ${provider.name}: ${result.download_links.length} link(s)`);
      return result;
    } catch (err) {
      logger.warn(`[VideoService] ${provider.name} failed: ${err.message}`);
      lastError = err;
      // Continue to next provider
    }
  }

  throw new Error(`All extraction APIs failed. Last error: ${lastError?.message || 'Unknown'}`);
}

module.exports = {
  smartUrlDetection,
  getMediaData,
};
