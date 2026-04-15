'use strict';

const IORedis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

/** @type {IORedis | null} */
let _client = null;

/**
 * Return (and lazily create) a singleton ioredis client.
 * @returns {IORedis}
 */
function getClient() {
  if (_client) return _client;

  const opts = {
    enabled: true,
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    tls: config.redis.tls,
    // Automatically reconnect with backoff
    retryStrategy: (times) => Math.min(times * 200, 5_000),
    maxRetriesPerRequest: null, // required by BullMQ
    enableReadyCheck: false,
    lazyConnect: false,
  };

  _client = new IORedis(opts);

  _client.on('connect', () => logger.info('[Redis] Connected'));
  _client.on('error', (err) => logger.error('[Redis] Error', { error: err.message }));
  _client.on('reconnecting', () => logger.warn('[Redis] Reconnecting…'));
  _client.on('close', () => logger.warn('[Redis] Connection closed'));

  return _client;
}

/**
 * Gracefully close the Redis connection.
 */
async function closeClient() {
  if (_client) {
    await _client.quit();
    _client = null;
    logger.info('[Redis] Connection closed gracefully');
  }
}

module.exports = { getClient, closeClient };
