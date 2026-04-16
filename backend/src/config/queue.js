const redis = require('./redis');

const queueConfig = {
  connection: redis,
  defaultJobOptions: {
    attempts: 1, // Only try once as requested, errors are returned
    removeOnComplete: true,
    removeOnFail: 1000,
  },
};

module.exports = queueConfig;
