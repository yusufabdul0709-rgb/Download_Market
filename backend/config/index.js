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
    // Resolution order:
    // 1. YTDLP_PATH env var (explicit override)
    // 2. Local bin/ directory (downloaded by postinstall script)
    // 3. System PATH (apt-get install on Render)
    binary: (() => {
      if (process.env.YTDLP_PATH) return process.env.YTDLP_PATH;
      const localBin = path.resolve(__dirname, '..', 'bin', process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
      const fs = require('fs');
      if (fs.existsSync(localBin)) return localBin;
      // Fall back to system PATH (works if installed via apt-get on Render)
      return 'yt-dlp';
    })(),
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

  redis: (() => {
    if (process.env.REDIS_URL) {
      try {
        const u = new URL(process.env.REDIS_URL);
        return {
          enabled: true,
          host: u.hostname,
          port: parseInt(u.port, 10) || 6379,
          password: u.password || null,
          tls: u.protocol === 'rediss:' ? {} : false,
        };
      } catch { }
    }
    return { enabled: false, host: '127.0.0.1', port: 6379, password: null, tls: false };
  })(),

  // ── Supported platforms / domains ────────────────────────────────────────
  supportedPlatforms: ['instagram', 'facebook', 'youtube'],
  supportedDomains: [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'instagram.com',
    'www.instagram.com',
    'facebook.com',
    'www.facebook.com',
    'fb.watch',
    'm.facebook.com',
  ],
};

module.exports = config;
