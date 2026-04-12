'use strict';

// Load env variables before anything else
require('dotenv').config();

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const corsMiddleware = require('./middlewares/cors');
const { generalLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const downloadRoutes = require('./routes/download');
const previewRoutes = require('./routes/preview');
const healthRoutes = require('./routes/health');

const { startCleanupScheduler, ensureTempDir } = require('./services/cleanupService');
const logger = require('./utils/logger');

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();

// ── Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// ── CORS
app.use(corsMiddleware);

// ── Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Request logging
app.use(
  morgan(config.isDev ? 'dev' : 'combined', {
    stream: { write: (msg) => logger.http(msg.trimEnd()) },
  })
);

// ── General rate limiter
app.use('/api', generalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/download', downloadRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/health', healthRoutes);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'Download Market API',
    version: '1.0.0',
    docs: `${config.baseUrl}/api/health`,
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found.',
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

  // 3. Start HTTP server
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info(
      `[Bootstrap] Download Market API running on port ${config.port} [${config.nodeEnv}]`
    );
    logger.info(`[Bootstrap] Base URL: ${config.baseUrl}`);
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
