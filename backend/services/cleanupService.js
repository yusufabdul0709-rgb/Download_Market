'use strict';

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const config = require('../config');
const logger = require('../utils/logger');

const TEMP_DIR = path.resolve(config.tempDir);

/**
 * Ensure the temp directory exists.
 */
function ensureTempDir() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
    logger.info(`[Cleanup] Created temp directory: ${TEMP_DIR}`);
  }
}

/**
 * Delete a single file safely.
 * @param {string} filePath  Absolute path
 */
async function deleteFile(filePath) {
  try {
    await fs.promises.unlink(filePath);
    logger.debug(`[Cleanup] Deleted: ${filePath}`);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      logger.warn(`[Cleanup] Could not delete ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Scan the temp directory and delete files older than FILE_TTL_SECONDS.
 */
async function cleanupStaleFiles() {
  ensureTempDir();

  let files;
  try {
    files = await fs.promises.readdir(TEMP_DIR);
  } catch (err) {
    logger.error('[Cleanup] Cannot read temp dir', { error: err.message });
    return;
  }

  const cutoffMs = config.fileTTLSeconds * 1000;
  const now = Date.now();
  let removed = 0;

  for (const file of files) {
    if (file === '.gitkeep') continue;          // preserve placeholder
    const fullPath = path.join(TEMP_DIR, file);
    try {
      const stat = await fs.promises.stat(fullPath);
      if (now - stat.mtimeMs > cutoffMs) {
        await deleteFile(fullPath);
        removed++;
      }
    } catch {
      /* ignore stat errors */
    }
  }

  if (removed > 0) {
    logger.info(`[Cleanup] Removed ${removed} stale file(s)`);
  }
}

/**
 * Start the background cleanup cron job.
 * Runs every 5 minutes.
 */
function startCleanupScheduler() {
  ensureTempDir();

  cron.schedule('*/5 * * * *', async () => {
    logger.debug('[Cleanup] Running scheduled cleanup…');
    await cleanupStaleFiles();
  });

  logger.info('[Cleanup] Scheduler started (every 5 minutes)');
}

module.exports = { ensureTempDir, deleteFile, cleanupStaleFiles, startCleanupScheduler };
