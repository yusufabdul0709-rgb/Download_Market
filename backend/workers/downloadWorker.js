'use strict';

const { Worker } = require('bullmq');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const config = require('../config');
const { getClient } = require('../config/redis');
const { updateJob } = require('../services/jobStore');
const { buildDownloadArgs, parseProgress, fetchMetadata } = require('../utils/ytdlp');
const { deleteFile, ensureTempDir } = require('../services/cleanupService');
const logger = require('../utils/logger');
const { spawn } = require('child_process');

const TEMP_DIR = path.resolve(config.tempDir);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Attempt to find the actual output file produced by yt-dlp.
 * yt-dlp may change the extension (e.g. .webm → .mp4 after merge).
 *
 * @param {string} expectedBase  e.g. /temp/abc123
 * @returns {string|null}
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
 * Run yt-dlp as a spawned process with live progress tracking.
 *
 * @param {string[]} args
 * @param {string}   jobId
 * @param {number}   [timeoutMs=300_000]
 * @returns {Promise<void>}
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

    const handleLine = async (line) => {
      const pct = parseProgress(line);
      if (pct !== null) {
        await updateJob(jobId, { progress: pct }).catch(() => {});
      }
      logger.debug(`[Worker][${jobId}] ${line.trim()}`);
    };

    let stderrBuf = '';

    proc.stdout.on('data', (chunk) => chunk.split('\n').forEach(handleLine));
    proc.stderr.on('data', (chunk) => {
      stderrBuf += chunk;
      chunk.split('\n').forEach(handleLine);
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`yt-dlp exited ${code}: ${stderrBuf.slice(-400).trim()}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to spawn yt-dlp: ${err.message}`));
    });
  });
}

// ─── Processor ───────────────────────────────────────────────────────────────

/**
 * Main job processor executed by the BullMQ Worker.
 * @param {import('bullmq').Job} job
 */
async function processDownloadJob(job) {
  const { jobId, url, type, formatId } = job.data;
  logger.info(`[Worker] Processing job ${jobId} | type=${type} | url=${url}`);

  // ── 1. Mark as processing ─────────────────────────────────────────────────
  await updateJob(jobId, { status: 'processing', progress: 0 });

  // ── 2. Validate URL & check duration limit ───────────────────────────────
  ensureTempDir();

  let metadata;
  try {
    metadata = await fetchMetadata(url);
  } catch (err) {
    throw new Error(`Metadata fetch failed: ${err.message}`);
  }

  const maxDur = config.ytdlp.maxDurationSeconds;
  if (maxDur > 0 && metadata.duration && metadata.duration > maxDur) {
    throw new Error(
      `Video duration (${Math.ceil(metadata.duration / 60)} min) exceeds the allowed limit of ${maxDur / 60} min.`
    );
  }

  // ── 3. Build output path ──────────────────────────────────────────────────
  // Use a unique base name so parallel downloads never collide
  const outBase = path.join(TEMP_DIR, `${jobId}`);
  const outTemplate = type === 'audio'
    ? `${outBase}.%(ext)s`
    : `${outBase}.%(ext)s`;

  // ── 4. Build yt-dlp args ──────────────────────────────────────────────────
  const args = buildDownloadArgs({ url, type, formatId: formatId || null, outPath: outTemplate });

  // ── 5. Run the download ───────────────────────────────────────────────────
  await updateJob(jobId, { progress: 5 });
  await runDownload(args, jobId);

  // ── 6. Locate the output file ─────────────────────────────────────────────
  const outputFile = findOutputFile(outBase);
  if (!outputFile || !fs.existsSync(outputFile)) {
    throw new Error('Output file not found after download completed.');
  }

  // ── 7. Build public download URL ──────────────────────────────────────────
  const fileName = path.basename(outputFile);
  const downloadUrl = `${config.baseUrl}/api/download/file/${jobId}/${encodeURIComponent(fileName)}`;

  // ── 8. Mark completed ─────────────────────────────────────────────────────
  await updateJob(jobId, {
    status: 'completed',
    progress: 100,
    filePath: outputFile,
    downloadUrl,
  });

  logger.info(`[Worker] Job ${jobId} completed → ${outputFile}`);
}

// ─── Worker Bootstrap ─────────────────────────────────────────────────────────

function startWorker() {
  const worker = new Worker(config.queue.name, processDownloadJob, {
    connection: getClient(),
    concurrency: config.queue.concurrency,
    // Give each job plenty of time (5 min lock)
    lockDuration: 300_000,
  });

  worker.on('completed', (job) =>
    logger.info(`[Worker] Job ${job.id} finished`)
  );

  worker.on('failed', async (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
    if (job?.data?.jobId) {
      await updateJob(job.data.jobId, {
        status: 'failed',
        error: err.message,
      }).catch(() => {});
    }
  });

  worker.on('error', (err) =>
    logger.error('[Worker] Worker error', { error: err.message })
  );

  logger.info(
    `[Worker] Started — queue="${config.queue.name}" concurrency=${config.queue.concurrency}`
  );

  // Graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`[Worker] ${signal} received — draining jobs…`);
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  return worker;
}

// Allow running this file directly: `node workers/downloadWorker.js`
if (require.main === module) {
  startWorker();
}

module.exports = { startWorker };
