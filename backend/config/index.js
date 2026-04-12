'use strict';

require('dotenv').config();

const path = require('path');

/**
 * Central configuration object.
 * Runs fully in-memory — no Redis required.
 */
const config = {
  // ── Server ──────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // ── CORS ────────────────────────────────────────────────────────────────
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),

  // ── yt-dlp ───────────────────────────────────────────────────────────────
  ytdlp: {
    binary: process.env.YTDLP_PATH || 'yt-dlp',
    maxDurationSeconds:
      parseInt(process.env.MAX_DURATION_SECONDS, 10) || 3600,
    // Path to Netscape-format cookies.txt file exported from your browser.
    // This is the #1 fix for YouTube bot detection / 429 errors.
    cookiesPath: process.env.YTDLP_COOKIES_PATH
      ? path.resolve(process.env.YTDLP_COOKIES_PATH)
      : null,
    // Realistic browser User-Agent to avoid bot fingerprinting
    userAgent:
      process.env.YTDLP_USER_AGENT ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    // Optional: SOCKS5 or HTTP proxy URL for rotating IPs
    proxy: process.env.YTDLP_PROXY || null,
  },

  // ── Concurrency control ─────────────────────────────────────────────────
  concurrency: {
    maxDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS, 10) || 2,
    maxPreviews: parseInt(process.env.MAX_CONCURRENT_PREVIEWS, 10) || 3,
  },

  // ── File handling ────────────────────────────────────────────────────────
  tempDir: process.env.TEMP_DIR || './temp',
  fileTTLSeconds: parseInt(process.env.FILE_TTL_SECONDS, 10) || 900,

  // ── Rate limiting ────────────────────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 60,
  },

  // ── Public URL ───────────────────────────────────────────────────────────
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',

  // ── Supported platforms / domains ────────────────────────────────────────
  supportedPlatforms: ['youtube', 'instagram'],
  supportedDomains: [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'm.youtube.com',
    'instagram.com',
    'www.instagram.com',
  ],
};

module.exports = config;
