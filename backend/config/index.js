'use strict';

require('dotenv').config();

/**
 * Central configuration object.
 * All environment variables are read and validated here so that the rest
 * of the application can import this module and trust the values.
 */
const config = {
  // ── Server ──────────────────────────────────────────────────────────────
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  // ── CORS ────────────────────────────────────────────────────────────────
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),

  // ── Redis ────────────────────────────────────────────────────────────────
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    tls: process.env.REDIS_TLS === '1' ? {} : undefined,
    // Key expiry for job metadata (seconds)
    jobTTL: parseInt(process.env.FILE_TTL_SECONDS, 10) || 900,
  },

  // ── BullMQ ───────────────────────────────────────────────────────────────
  queue: {
    name: process.env.QUEUE_NAME || 'downloadQueue',
    concurrency: parseInt(process.env.WORKER_CONCURRENCY, 10) || 3,
  },

  // ── yt-dlp ───────────────────────────────────────────────────────────────
  ytdlp: {
    binary: process.env.YTDLP_PATH || 'yt-dlp',
    maxDurationSeconds:
      parseInt(process.env.MAX_DURATION_SECONDS, 10) || 3600,
  },

  // ── File handling ────────────────────────────────────────────────────────
  tempDir: process.env.TEMP_DIR || './temp',
  fileTTLSeconds: parseInt(process.env.FILE_TTL_SECONDS, 10) || 900,

  // ── Rate limiting ────────────────────────────────────────────────────────
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 30,
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
