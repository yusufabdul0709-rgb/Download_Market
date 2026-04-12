'use strict';

const cors = require('cors');
const config = require('../config');
const logger = require('../utils/logger');

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be more permissive
    if (config.isDev) {
      logger.warn(`[CORS] Allowing unlisted origin in dev mode: ${origin}`);
      return callback(null, true);
    }

    logger.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS: Origin "${origin}" is not allowed.`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Job-Id', 'Content-Disposition', 'Content-Length'],
  credentials: false,
  maxAge: 600, // 10-minute preflight cache
};

module.exports = cors(corsOptions);
