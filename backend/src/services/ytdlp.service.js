const { spawn } = require('child_process');
const config = require('../../config');
const logger = require('../config/logger');
const { buildYtdlpArgs, selectFormat } = require('../utils/formatSelector');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Inject optional Deno execution path (for yt-dlp anti-bot)
const spawnEnv = { ...process.env };
const DENO_BIN_DIR = path.join(os.homedir(), '.deno', 'bin');
if (fs.existsSync(DENO_BIN_DIR)) {
  const sep = process.platform === 'win32' ? ';' : ':';
  spawnEnv.PATH = `${DENO_BIN_DIR}${sep}${process.env.PATH || ''}`;
}

const YTDLP_TIMEOUT_MS = 30000; // 30s hard limit

function runYtdlp(args) {
  return new Promise((resolve, reject) => {
    // using yt-dlp-wrap or local binary path from env
    const ytdlpBin = process.env.YTDLP_PATH || 'yt-dlp';
    
    logger.debug(`[yt-dlp] Spawn: ${ytdlpBin} ${args.join(' ')}`);

    const proc = spawn(ytdlpBin, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      env: spawnEnv,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');

    proc.stdout.on('data', chunk => stdout += chunk);
    proc.stderr.on('data', chunk => stderr += chunk);

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('TIMEOUT'));
    }, YTDLP_TIMEOUT_MS);

    proc.on('close', code => {
      clearTimeout(timer);
      if (code === 0) {
        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch (e) {
          reject(new Error('INVALID_JSON'));
        }
      } else {
        const errHint = stderr.slice(-300).toLowerCase();
        if (errHint.includes('private') || errHint.includes('sign in')) {
          reject(new Error('PRIVATE_CONTENT'));
        } else if (errHint.includes('unsupported')) {
          reject(new Error('UNSUPPORTED_PLATFORM'));
        } else if (errHint.includes('429') || errHint.includes('too many')) {
          reject(new Error('RATE_LIMITED'));
        } else if (errHint.includes('offline') || errHint.includes('not found')) {
          reject(new Error('UNAVAILABLE'));
        } else {
          reject(new Error('EXTRACTION_FAILED'));
        }
      }
    });

    proc.on('error', err => {
      clearTimeout(timer);
      reject(new Error(`SPAWN_FAILED: ${err.message}`));
    });
  });
}

/**
 * Main extraction function
 */
async function extractMedia(url, platform, type) {
  const args = buildYtdlpArgs(url, type);
  const metadata = await runYtdlp(args);
  
  const formats = selectFormat(metadata.formats || [metadata], type);
  let isAudio = type === 'audio' ? true : (formats.length > 0 && formats[0].quality === 'audio');
  
  return {
    platform,
    type: isAudio ? 'audio' : 'video',
    media: formats
  };
}

module.exports = { extractMedia };
