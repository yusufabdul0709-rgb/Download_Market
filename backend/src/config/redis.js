const Redis = require('ioredis');
const logger = require('./logger');

const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

if (process.env.REDIS_PASSWORD) {
  redisOptions.password = process.env.REDIS_PASSWORD;
}

const redis = new Redis(redisOptions);

redis.on('connect', () => {
  logger.info('[Redis] Connected successfully');
});

redis.on('error', (err) => {
  logger.error('[Redis] Connection error:', err);
});

module.exports = redis;
