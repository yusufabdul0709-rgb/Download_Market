'use strict';

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const { getDownloadQueue } = require('../queues/downloadQueue');
const { createJob, getJob, updateJob } = require('../services/jobStore');
const { deleteFile } = require('../services/cleanupService');
const { validateUrl, validatePlatform, validateMediaType } = require('../utils/validator');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const config = require('../config');

// ── Submit Download Job ───────────────────────────────────────────────────────

/**
 * POST /api/download
 *
 * Accepts a URL, platform and type, creates a Redis job record and enqueues
 * a BullMQ job for background processing.
 */
const submitDownload = asyncHandler(async (req, res) => {
  const { url, platform, type, formatId } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) throw new AppError(urlCheck.error, 400, 'INVALID_URL');

  const platformCheck = validatePlatform(platform);
  if (!platformCheck.valid) throw new AppError(platformCheck.error, 400, 'INVALID_PLATFORM');

  const typeCheck = validateMediaType(type);
  if (!typeCheck.valid) throw new AppError(typeCheck.error, 400, 'INVALID_TYPE');

  // Verify the URL domain matches the declared platform
  const detectedPlatform = urlCheck.platform;
  if (detectedPlatform !== platform) {
    throw new AppError(
      `URL domain does not match the declared platform "${platform}".`,
      400,
      'PLATFORM_MISMATCH'
    );
  }

  // ── Create job ──────────────────────────────────────────────────────────
  const jobId = uuidv4();

  await createJob(jobId, {
    url: urlCheck.url.href,
    platform,
    type,
  });

  // ── Enqueue ─────────────────────────────────────────────────────────────
  const queue = getDownloadQueue();
  await queue.add(
    'download',
    { jobId, url: urlCheck.url.href, platform, type, formatId: formatId || null },
    { jobId } // Use our own ID as BullMQ's job name for traceability
  );

  logger.info(`[Controller] Queued job ${jobId} — ${platform}/${type}`);

  res.status(202).json({
    success: true,
    jobId,
    status: 'queued',
    message: 'Your download has been queued. Poll the status endpoint for updates.',
    statusUrl: `${config.baseUrl}/api/download/${jobId}`,
  });
});

// ── Get Job Status ────────────────────────────────────────────────────────────

/**
 * GET /api/download/:jobId
 *
 * Returns the current status (queued | processing | completed | failed)
 * along with progress and the download URL once complete.
 */
const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId || jobId.length < 10) {
    throw new AppError('Invalid job ID.', 400, 'INVALID_JOB_ID');
  }

  const record = await getJob(jobId);
  if (!record) {
    throw new AppError('Job not found. It may have expired.', 404, 'JOB_NOT_FOUND');
  }

  const response = {
    success: true,
    jobId: record.jobId,
    status: record.status,
    progress: record.progress,
    platform: record.platform,
    type: record.type,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
  };

  if (record.status === 'completed') {
    response.downloadUrl = record.downloadUrl;
  }

  if (record.status === 'failed') {
    response.error = record.error;
  }

  res.json(response);
});

// ── Serve Downloaded File ─────────────────────────────────────────────────────

/**
 * GET /api/download/file/:jobId/:filename
 *
 * Streams the completed file back to the client.
 * Deletes the file from disk immediately after the stream finishes.
 */
const serveFile = asyncHandler(async (req, res) => {
  const { jobId, filename } = req.params;

  const record = await getJob(jobId);
  if (!record || record.status !== 'completed') {
    throw new AppError('File not ready or job not found.', 404, 'FILE_NOT_READY');
  }

  // Safety: ensure filename doesn't escape temp dir
  const safeFilename = path.basename(decodeURIComponent(filename));
  const expectedPath = path.resolve(config.tempDir, safeFilename);
  const filePath = record.filePath;

  // Validate the filePath stored in Redis matches what is requested
  if (!filePath || path.resolve(filePath) !== expectedPath) {
    throw new AppError('File path mismatch.', 403, 'FORBIDDEN');
  }

  if (!fs.existsSync(filePath)) {
    throw new AppError('File has already been deleted or expired.', 410, 'FILE_GONE');
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();

  const mimeMap = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
  };

  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('X-Job-Id', jobId);

  const readStream = fs.createReadStream(filePath);

  readStream.on('error', (err) => {
    logger.error(`[Controller] Stream error for job ${jobId}`, { error: err.message });
    if (!res.headersSent) res.status(500).end();
  });

  readStream.on('end', async () => {
    logger.info(`[Controller] File served for job ${jobId} — scheduling deletion`);
    // Mark job as no longer available and delete the file
    await updateJob(jobId, { status: 'downloaded', downloadUrl: null });
    await deleteFile(filePath);
  });

  readStream.pipe(res);
});

module.exports = { submitDownload, getJobStatus, serveFile };
