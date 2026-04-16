const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default; // Using the syntax for modern express-rate-limit
const redis = require('../config/redis');

// Sliding window using Redis
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window` (here, per minute)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.'
  },
  // If redis allows storing
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
});

module.exports = limiter;
