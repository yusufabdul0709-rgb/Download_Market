'use strict';

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const { createJob, getJob, updateJob } = require('../services/jobStore');
const { deleteFile, ensureTempDir } = require('../services/cleanupService');
const { validateUrl, validatePlatform, validateMediaType } = require('../utils/validator');
const { buildDownloadArgs, parseProgress, fetchMetadata } = require('../utils/ytdlp');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const config = require('../config');

const TEMP_DIR = path.resolve(config.tempDir);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Find output file produced by yt-dlp (extension may change after merge).
 */
function findOutputFile(expectedBase) {
  const dir = path.dirname(expectedBase);
  const baseName = path.basename(expectedBase);
  try {
    const files = fs.readdirSync(dir);
    const match = files.find((f) => f.startsWith(baseName));
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

/**
 * Run yt-dlp download with live progress. No BullMQ — runs in-process.
 */
function runDownload(args, jobId, timeoutMs = 300_000) {
  return new Promise((resolve, reject) => {
    const ytdlpBin = config.ytdlp.binary;

    const proc = spawn(ytdlpBin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('yt-dlp download timed out'));
    }, timeoutMs);

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');

    let stderrBuf = '';

    const handleLine = (line) => {
      const pct = parseProgress(line);
      if (pct !== null) {
        updateJob(jobId, { progress: pct });
      }
    };

    proc.stdout.on('data', (chunk) => chunk.split('\n').forEach(handleLine));
    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk;
      chunk.split('\n').forEach(handleLine);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`yt-dlp exited ${code}: ${stderrBuf.slice(-400).trim()}`));
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });
  });
}

/**
 * Process a download job in-process (no worker/queue).
 */
async function processJob(jobId) {
  const job = getJob(jobId);
  if (!job) return;

  const { url, type } = job;

  try {
    updateJob(jobId, { status: 'processing', progress: 0 });
    ensureTempDir();

    // Check duration
    let metadata;
    try {
      metadata = await fetchMetadata(url);
    } catch (err) {
      throw new Error(`Metadata fetch failed: ${err.message}`);
    }

    const maxDur = config.ytdlp.maxDurationSeconds;
    if (maxDur > 0 && metadata.duration && metadata.duration > maxDur) {
      throw new Error(
        `Video duration (${Math.ceil(metadata.duration / 60)} min) exceeds the limit of ${maxDur / 60} min.`
      );
    }

    // Build args
    const formatId = job.formatId || null;
    const outBase = path.join(TEMP_DIR, jobId);
    const outTemplate = `${outBase}.%(ext)s`;
    const args = buildDownloadArgs({ url, type, formatId, outPath: outTemplate });

    updateJob(jobId, { progress: 5 });
    await runDownload(args, jobId);

    // Find file
    const outputFile = findOutputFile(outBase);
    if (!outputFile || !fs.existsSync(outputFile)) {
      throw new Error('Output file not found after download.');
    }

    const fileName = path.basename(outputFile);
    const downloadUrl = `${config.baseUrl}/api/download/file/${jobId}/${encodeURIComponent(fileName)}`;

    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      filePath: outputFile,
      downloadUrl,
      filename: fileName,
    });

    logger.info(`[Download] Job ${jobId} completed → ${outputFile}`);
  } catch (err) {
    logger.error(`[Download] Job ${jobId} failed: ${err.message}`);
    updateJob(jobId, {
      status: 'failed',
      error: err.message,
    });
  }
}

// ── Submit Download Job ───────────────────────────────────────────────────────

const submitDownload = asyncHandler(async (req, res) => {
  const { url, platform, type, formatId } = req.body;

  // Validation
  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) throw new AppError(urlCheck.error, 400, 'INVALID_URL');

  const platformCheck = validatePlatform(platform);
  if (!platformCheck.valid) throw new AppError(platformCheck.error, 400, 'INVALID_PLATFORM');

  const typeCheck = validateMediaType(type);
  if (!typeCheck.valid) throw new AppError(typeCheck.error, 400, 'INVALID_TYPE');

  const detectedPlatform = urlCheck.platform;
  if (detectedPlatform !== platform) {
    throw new AppError(
      `URL domain does not match the declared platform "${platform}".`,
      400,
      'PLATFORM_MISMATCH'
    );
  }

  // Create job
  const jobId = uuidv4();
  const jobRecord = createJob(jobId, {
    url: urlCheck.url.href,
    platform,
    type,
  });

  // Store formatId on the job for processJob to use
  jobRecord.formatId = formatId || null;

  // Start processing in background (non-blocking)
  processJob(jobId).catch(() => {});

  logger.info(`[Controller] Started job ${jobId} — ${platform}/${type}`);

  res.status(202).json({
    success: true,
    jobId,
    status: 'queued',
    message: 'Your download has been started. Poll the status endpoint for updates.',
    statusUrl: `${config.baseUrl}/api/download/${jobId}`,
  });
});

// ── Get Job Status ────────────────────────────────────────────────────────────

const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  if (!jobId || jobId.length < 10) {
    throw new AppError('Invalid job ID.', 400, 'INVALID_JOB_ID');
  }

  const record = getJob(jobId);
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
    response.filename = record.filename;
  }

  if (record.status === 'failed') {
    response.error = record.error;
  }

  res.json(response);
});

// ── Serve Downloaded File ─────────────────────────────────────────────────────

const serveFile = asyncHandler(async (req, res) => {
  const { jobId, filename } = req.params;

  const record = getJob(jobId);
  if (!record || record.status !== 'completed') {
    throw new AppError('File not ready or job not found.', 404, 'FILE_NOT_READY');
  }

  const safeFilename = path.basename(decodeURIComponent(filename));
  const filePath = record.filePath;

  if (!filePath || !fs.existsSync(filePath)) {
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
    logger.info(`[Controller] File served for job ${jobId}`);
  });

  readStream.pipe(res);
});

module.exports = { submitDownload, getJobStatus, serveFile };
