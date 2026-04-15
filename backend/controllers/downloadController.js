'use strict';

const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const { createJob, getJob, updateJob } = require('../services/jobStore');
const { enqueueDownload } = require('../services/concurrencyQueue');
const { deleteFile, ensureTempDir } = require('../services/cleanupService');
const { validateUrl, validatePlatform, validateMediaType } = require('../utils/validator');
const { buildDownloadArgs, parseProgress, fetchMetadata, normaliseMediaUrl } = require('../utils/ytdlp');
// videoService removed — all platforms now use yt-dlp via async job queue
const axios = require('axios');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;
const archiver = require('archiver');
const { retryWithBackoff, isRetryableError } = require('../utils/retryHelper');
const { asyncHandler, AppError } = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const config = require('../config');

const TEMP_DIR = path.resolve(config.tempDir);

// ── Deno PATH for download spawns ─────────────────────────────────────────────
const DENO_BIN_DIR = path.join(os.homedir(), '.deno', 'bin');
const spawnEnv = { ...process.env };
const sep = process.platform === 'win32' ? ';' : ':';

if (fs.existsSync(DENO_BIN_DIR)) {
  spawnEnv.PATH = `${DENO_BIN_DIR}${sep}${spawnEnv.PATH || ''}`;
}

// Add ffmpeg and ffprobe directories directly to the execution PATH
// yt-dlp automatically resolves them safely without --ffmpeg-location
if (ffmpegPath && ffprobePath) {
  const ffmpegDir = path.dirname(ffmpegPath);
  const ffprobeDir = path.dirname(ffprobePath);
  // Ensure we don't prepend duplicate dirs if they are the same
  const binDirs = Array.from(new Set([ffmpegDir, ffprobeDir])).join(sep);
  spawnEnv.PATH = `${binDirs}${sep}${spawnEnv.PATH || ''}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Sanitise a string for use as a safe filename.
 * Removes/replaces characters that are illegal on Windows/macOS/Linux.
 *
 * @param {string} name
 * @param {number} [maxLength=200]
 * @returns {string}
 */
function sanitizeFilename(name, maxLength = 200) {
  if (!name) return 'download';

  return name
    // Remove characters illegal in filenames on any OS
    .replace(/[<>:"\/?*|\\]/g, '')
    // Replace sequences of whitespace / control chars with a single space
    .replace(/[\s\x00-\x1f]+/g, ' ')
    // Trim leading/trailing dots and spaces (Windows rejects these)
    .replace(/^[\s.]+|[\s.]+$/g, '')
    // Limit length (leave room for extension)
    .substring(0, maxLength)
    .trim()
    || 'download';
}

/**
 * Find output file produced by yt-dlp (extension may change after merge).
 */
function findOutputFile(expectedBase) {
  const dir = path.dirname(expectedBase);
  const baseName = path.basename(expectedBase);
  try {
    const files = fs.readdirSync(dir);
    // Find all files that start with the jobId
    const matches = files.filter((f) => f.startsWith(baseName));
    
    if (matches.length === 0) return null;

    // Filter out intermediate fragments (like .f140.m4a, .temp.mp4, .part)
    const finalFiles = matches.filter(f => !f.match(/\.f\d+\./) && !f.endsWith('.part') && !f.endsWith('.ytdl'));

    // Prefer mp4, then mp3, then webm
    const preferredOrder = ['.mp4', '.mp3', '.webm', '.mkv', '.m4a'];
    
    let bestMatch = null;
    let bestScore = Infinity;

    for (const f of (finalFiles.length > 0 ? finalFiles : matches)) {
      const ext = path.extname(f).toLowerCase();
      const score = preferredOrder.indexOf(ext);
      // If extension is found in preferredOrder, score is positive.
      // We want the lowest score (0 for .mp4 is best).
      const currentScore = score !== -1 ? score : 999;
      if (currentScore < bestScore) {
        bestScore = currentScore;
        bestMatch = f;
      }
    }

    return bestMatch ? path.join(dir, bestMatch) : null;
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
      shell: false,
      windowsHide: true,
      env: spawnEnv,
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
 * Downloads a single direct HTTP URL to a file.
 */
async function downloadDirectMedia(url, outputPath) {
  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
    timeout: 60000,
  });
  const writer = fs.createWriteStream(outputPath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

/**
 * Extracts audio out of an MP4 file into MP3 using ffmpeg.
 */
async function extractAudio(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', [
      '-y', '-i', inputPath,
      '-vn', '-ar', '44100', '-ac', '2', '-b:a', '128k',
      outputPath
    ], { stdio: 'ignore' });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });

    proc.on('error', (err) => reject(new Error(`Failed to start ffmpeg: ${err.message}`)));
  });
}

/**
 * Handle Instagram specific logic using yt-dlp (replaces broken instagram-url-direct).
 * yt-dlp natively supports Instagram posts, reels, and stories.
 */
async function processInstagramJob(jobId, job) {
  const { url, type } = job;
  const outBase = path.join(TEMP_DIR, jobId);

  let metadata;
  try {
    metadata = await fetchMetadata(url);
  } catch (err) {
    throw new Error(`Instagram metadata fetch failed: ${err.message}`);
  }

  updateJob(jobId, { progress: 10 });

  const formatId = job.formatId || null;
  const outTemplate = `${outBase}.%(ext)s`;

  const args = [];
  args.push('--no-playlist', '--no-warnings', '--no-check-certificates');

  if (formatId === 'audio' || type === 'audio') {
    // Extract audio as MP3
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outTemplate, url);
  } else {
    // Download best available video/image
    args.push('-f', 'best', '--merge-output-format', 'mp4', '-o', outTemplate, url);
  }

  updateJob(jobId, { progress: 20 });

  await retryWithBackoff(
    () => runDownload(args, jobId),
    { maxRetries: 1, initialDelay: 5000, shouldRetry: isRetryableError, label: `ig-download-${jobId}` }
  );

  const outputFile = findOutputFile(outBase);
  if (!outputFile || !fs.existsSync(outputFile)) {
    throw new Error('Output file not found after Instagram download.');
  }

  const ext = path.extname(outputFile).toLowerCase() || '.mp4';
  const title = metadata?.title || metadata?.description?.slice(0, 80) || 'Instagram Post';
  const prettyName = sanitizeFilename(title) + ext;

  return { outputFile, prettyName };
}

/**
 * Handle Facebook specific logic using yt-dlp.
 */
async function processFacebookJob(jobId, job) {
  const { url: originalUrl, type } = job;
  const url = await normaliseMediaUrl(originalUrl);
  const outBase = path.join(TEMP_DIR, jobId);

  let metadata;
  try {
    metadata = await fetchMetadata(url);
  } catch (err) {
    throw new Error(`Facebook metadata fetch failed: ${err.message}`);
  }

  const formatId = job.formatId || null;
  const outTemplate = `${outBase}.%(ext)s`;

  const args = [];
  args.push('--no-playlist', '--no-warnings', '--no-check-certificates');

  if (formatId === 'audio' || type === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outTemplate, url);
  } else {
    // Download best available
    const fId = (formatId && formatId !== 'best') ? `${formatId}+bestaudio/best` : 'bestvideo+bestaudio/best';
    args.push('-f', fId, '--merge-output-format', 'mp4', '-o', outTemplate, url);
  }

  await retryWithBackoff(
    () => runDownload(args, jobId),
    { maxRetries: 1, initialDelay: 5000, shouldRetry: isRetryableError, label: `fb-download-${jobId}` }
  );

  const outputFile = findOutputFile(outBase);
  if (!outputFile || !fs.existsSync(outputFile)) {
    throw new Error('Output file not found after Facebook download.');
  }

  const ext = path.extname(outputFile).toLowerCase() || '.mp4';
  const title = metadata?.title || metadata?.description?.slice(0, 80) || 'Facebook Video';
  const prettyName = sanitizeFilename(title) + ext;

  return { outputFile, prettyName };
}

/**
 * Handle YouTube specific logic using yt-dlp.
 */
async function processYouTubeJob(jobId, job) {
  const { url: originalUrl, type } = job;
  const url = await normaliseMediaUrl(originalUrl);
  const outBase = path.join(TEMP_DIR, jobId);

  let metadata;
  try {
    metadata = await fetchMetadata(url);
  } catch (err) {
    throw new Error(`YouTube metadata fetch failed: ${err.message}`);
  }

  updateJob(jobId, { progress: 10 });

  const formatId = job.formatId || null;
  const outTemplate = `${outBase}.%(ext)s`;

  const args = [];
  args.push('--no-playlist', '--no-warnings', '--no-check-certificates');

  if (formatId === 'audio' || type === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outTemplate, url);
  } else {
    // Download best available or specific format
    const fId = (formatId && formatId !== 'best') ? `${formatId}+bestaudio/best` : 'bestvideo+bestaudio/best';
    args.push('-f', fId, '--merge-output-format', 'mp4', '-o', outTemplate, url);
  }

  updateJob(jobId, { progress: 20 });

  await retryWithBackoff(
    () => runDownload(args, jobId),
    { maxRetries: 1, initialDelay: 5000, shouldRetry: isRetryableError, label: `yt-download-${jobId}` }
  );

  const outputFile = findOutputFile(outBase);
  if (!outputFile || !fs.existsSync(outputFile)) {
    throw new Error('Output file not found after YouTube download.');
  }

  const ext = path.extname(outputFile).toLowerCase() || '.mp4';
  const title = metadata?.title || metadata?.fulltitle || 'YouTube Video';
  const prettyName = sanitizeFilename(title) + ext;

  return { outputFile, prettyName };
}

/**
 * Process a download job in-process (no worker/queue).
 * Wrapped in the download concurrency limiter.
 */
async function processJob(jobId) {
  const job = getJob(jobId);
  if (!job) return;

  // Enqueue through the concurrency-limited download queue
  await enqueueDownload(async () => {
    try {
      updateJob(jobId, { status: 'processing', progress: 0 });
      ensureTempDir();

      let result;
      if (job.platform === 'instagram') {
        result = await processInstagramJob(jobId, job);
      } else if (job.platform === 'facebook') {
        result = await processFacebookJob(jobId, job);
      } else if (job.platform === 'youtube') {
        result = await processYouTubeJob(jobId, job);
      } else {
         throw new Error(`Platform ${job.platform} is not supported.`);
      }

      updateJob(jobId, { progress: 100 });

      const diskFileName = path.basename(result.outputFile);
      const downloadUrl = `/api/download/file/${jobId}/${encodeURIComponent(diskFileName)}`;

      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        filePath: result.outputFile,
        downloadUrl,
        filename: result.prettyName,
        diskFilename: diskFileName,
      });

      logger.info(`[Download] Job ${jobId} completed → ${result.prettyName}`);
    } catch (err) {
      logger.error(`[Download] Job ${jobId} failed: ${err.message}`);
      updateJob(jobId, {
        status: 'failed',
        error: err.message,
      });
    }
  });
}

// ── Submit Download Job ───────────────────────────────────────────────────────

const submitDownload = asyncHandler(async (req, res) => {
  const { url, platform, type, formatId } = req.body;

  // Step 1: Always validate the URL first
  const urlCheck = validateUrl(url);
  if (!urlCheck.valid) throw new AppError(urlCheck.error, 400, 'INVALID_URL');

  const detectedPlatform = urlCheck.platform;

  // Step 2: Validate platform & type
  const actualPlatform = platform || detectedPlatform;
  const platformCheck = validatePlatform(actualPlatform);
  if (!platformCheck.valid) throw new AppError(platformCheck.error, 400, 'INVALID_PLATFORM');

  const actualType = type || 'video';
  const typeCheck = validateMediaType(actualType);
  if (!typeCheck.valid) throw new AppError(typeCheck.error, 400, 'INVALID_TYPE');

  if (platform && detectedPlatform !== platform) {
    throw new AppError(
      `URL domain does not match the declared platform "${platform}".`,
      400,
      'PLATFORM_MISMATCH'
    );
  }

  // Step 3: All platforms → async job queue with yt-dlp
  const jobId = uuidv4();
  const jobRecord = createJob(jobId, {
    url: urlCheck.url.href,
    platform: actualPlatform,
    type: actualType,
    formatId,
  });

  jobRecord.formatId = formatId || null;

  processJob(jobId).catch(() => {});

  logger.info(`[Controller] Started async job ${jobId} — ${actualPlatform}/${actualType}`);

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

  const filePath = record.filePath;

  if (!filePath || !fs.existsSync(filePath)) {
    throw new AppError('File has already been deleted or expired.', 410, 'FILE_GONE');
  }

  // Use the human-friendly filename (video title) for the download,
  // NOT the UUID-based disk filename
  const prettyFilename = record.filename || path.basename(decodeURIComponent(filename));

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();

  const mimeMap = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
  };

  // RFC 5987 encoded filename for Unicode support + ASCII fallback
  const asciiName = prettyFilename.replace(/[^\x20-\x7E]/g, '_');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(prettyFilename)}`
  );
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
