const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const logger = require('./config/logger');

// Middlewares
const rateLimiter = require('./middlewares/rateLimiter');
const { validateRequest } = require('./middlewares/validateRequest');

// Controllers
const { handleDownloadRequest } = require('./controllers/download.controller');

// Workers
require('./workers/ytdlp.worker'); 

// Config
const redis = require('./config/redis');
const { extractionQueue } = require('./services/queue.service');

const app = express();
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

// Track metrics
const metrics = {
  total_requests: 0,
  success: 0,
  failure: 0,
  total_response_ms: 0,
};

// Security and basic middlewares
app.use(helmet());
app.use(cors());
// 10kb limit on body size for security
app.use(express.json({ limit: '10kb' })); 

// Metrics tracking middleware
app.use('/api/download', (req, res, next) => {
  const start = Date.now();
  metrics.total_requests++;

  // Hook into response finish
  res.on('finish', () => {
    const ms = Date.now() - start;
    metrics.total_response_ms += ms;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.success++;
    } else {
      metrics.failure++;
    }
  });

  next();
});

// API Routes
app.post('/api/download', rateLimiter, validateRequest, handleDownloadRequest);

// Health Endpoint
app.get('/health', async (req, res) => {
  try {
    const queueCount = await extractionQueue.getJobCounts();
    const redisStatus = redis.status;
    
    res.json({
      status: 'ok',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      queued_jobs: queueCount.waiting || 0,
      active_jobs: queueCount.active || 0,
      redis: redisStatus === 'ready' ? 'connected' : redisStatus
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Metrics Endpoint
app.get('/metrics', (req, res) => {
  const success_rate = metrics.total_requests > 0 
    ? ((metrics.success / metrics.total_requests) * 100).toFixed(2) + '%' 
    : '0%';
  const failure_rate = metrics.total_requests > 0 
    ? ((metrics.failure / metrics.total_requests) * 100).toFixed(2) + '%' 
    : '0%';
  const avg_response_ms = metrics.total_requests > 0 
    ? Math.floor(metrics.total_response_ms / metrics.total_requests) 
    : 0;

  res.json({
    total_requests: metrics.total_requests,
    success_rate,
    failure_rate,
    avg_response_ms
  });
});

// Catch-all
app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Not found' });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`[Server] Media Extraction API listening on port ${PORT}`);
});
