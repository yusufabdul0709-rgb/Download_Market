'use strict';

// Load env variables before anything else
require('dotenv').config();

const http = require('http');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cron = require('node-cron');
const axios = require('axios');

const config = require('./config');
const corsMiddleware = require('./middlewares/cors');
const { generalLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const downloadRoutes = require('./routes/download');
const previewRoutes = require('./routes/preview');
const healthRoutes = require('./routes/health');
const getVideo = require('./services/downloader');

const { startCleanupScheduler, ensureTempDir } = require('./services/cleanupService');
const logger = require('./utils/logger');

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

// ── Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // Relax CSP in dev for hot reload
    contentSecurityPolicy: config.isDev ? false : undefined,
  })
);

// ── CORS
app.use(corsMiddleware);

// ── Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    logger.info('[HTTP] request complete', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: elapsed,
    });
  });
  next();
});

// ── Request logging
app.use(
  morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.http(msg.trimEnd()) },
  })
);

// ── General rate limiter
app.use('/api', generalLimiter);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use('/api/download', downloadRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/health', healthRoutes);

// Lightweight compatibility route for simple frontend fetch("/download")
app.post('/download', async (req, res) => {
  const { url } = req.body || {};
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL required' });
  }
  try {
    const result = await getVideo(url);
    return res.json(result);
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ── API root info
app.get('/api', (_req, res) => {
  res.json({
    name: 'Download Market API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      preview: 'POST /api/preview',
      download: 'POST /api/download',
      downloadStatus: 'GET /api/download/:jobId',
      health: 'GET /api/health',
    },
  });
});

// ─── Serve Frontend (Production Only) ─────────────────────────────────────────
// If the frontend dist/ folder exists, serve it as static files.
// This allows single-server deployment (backend + frontend on one host).

const frontendDist = path.join(__dirname, '..', 'dist');
const fs = require('fs');

if (fs.existsSync(frontendDist)) {
  logger.info('[Bootstrap] Serving frontend static files from dist/');
  app.use(express.static(frontendDist));

  // SPA catch-all: any non-API route → serve index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Root info when no frontend built
  app.get('/', (_req, res) => {
    res.json({
      name: 'Download Market API',
      version: '1.0.0',
      docs: `${config.baseUrl}/api/health`,
    });
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Video not found',
    source: 'api1/api2',
    code: 'NOT_FOUND',
  });
});

// Global error handler — MUST be last
app.use(errorHandler);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Ensure temp directory exists
  ensureTempDir();

  // 2. Start the cleanup cron job
  startCleanupScheduler();

  if (!config.isDev && config.baseUrl.startsWith('http')) {
    cron.schedule('*/8 * * * *', async () => {
      const healthUrl = `${config.baseUrl}/api/health`;
      try {
        await axios.get(healthUrl, { timeout: 9_000 });
        logger.debug(`[KeepAlive] Ping success: ${healthUrl}`);
      } catch (err) {
        logger.warn('[KeepAlive] Ping failed', { message: err.message, url: healthUrl });
      }
    });
    logger.info('[KeepAlive] Scheduler started (every 8 minutes)');
  }

  // 3. Start HTTP server
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(
      `[Bootstrap] Download Market API running on port ${config.port} [${config.nodeEnv}]`
    );
    logger.info(`[Bootstrap] Base URL: ${config.baseUrl}`);
    logger.info(`[Bootstrap] CORS allowed origins: ${config.allowedOrigins.join(', ')}`);
    logger.info('[Bootstrap] No Redis required — using in-memory storage');
  });

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`[Shutdown] ${signal} received — closing server…`);
    server.close(() => {
      logger.info('[Shutdown] HTTP server closed — bye!');
      process.exit(0);
    });

    // Force exit after 10s if something hangs
    setTimeout(() => {
      logger.error('[Shutdown] Forced exit after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled rejections / exceptions
  process.on('unhandledRejection', (reason) => {
    logger.error('[Process] Unhandled rejection', { reason: String(reason) });
  });

  process.on('uncaughtException', (err) => {
    logger.error('[Process] Uncaught exception — exiting', {
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });
}

bootstrap();

module.exports = app;
