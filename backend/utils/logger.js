'use strict';

const { createLogger, format, transports } = require('winston');
const config = require('../config');

const { combine, timestamp, errors, printf, colorize, json } = format;

// ── Human-readable format (development) ──────────────────────────────────────
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const extra = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${ts} [${level}] ${stack || message} ${extra}`.trimEnd();
  })
);

// ── Structured JSON format (production) ──────────────────────────────────────
const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

const logger = createLogger({
  level: config.isDev ? 'debug' : 'info',
  format: config.isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    // Always write errors to file
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Full log in production
    ...(!config.isDev
      ? [new transports.File({ filename: 'logs/combined.log' })]
      : []),
  ],
  exitOnError: false,
});

module.exports = logger;
