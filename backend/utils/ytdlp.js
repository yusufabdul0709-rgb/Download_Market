'use strict';

const { spawn } = require('child_process');
const config = require('../config');
const logger = require('./logger');

/**
 * Run yt-dlp with the given arguments.
 *
 * @param {string[]} args     CLI arguments
 * @param {object}   options
 * @param {number}   [options.timeoutMs=120_000]  Kill timeout
 * @param {Function} [options.onStderr]            Called with each stderr chunk
 * @returns {Promise<string>}  Resolved with combined stdout
 */
function runYtdlp(args, { timeoutMs = 120_000, onStderr } = {}) {
  return new Promise((resolve, reject) => {
    const ytdlp = config.ytdlp.binary;
    logger.debug(`[yt-dlp] ${ytdlp} ${args.join(' ')}`);

    // Do NOT use shell: true — it breaks arguments that contain spaces
    // (like --user-agent values). Using the full binary path avoids the
    // need for shell PATH resolution.
    const proc = spawn(ytdlp, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', (chunk) => {
      stderr += chunk;
      if (typeof onStderr === 'function') onStderr(chunk);
    });

    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error(`yt-dlp timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve(stdout);
      } else {
        const hint = stderr.slice(-500).trim();
        reject(new Error(`yt-dlp exited with code ${code}: ${hint}`));
      }
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start yt-dlp: ${err.message}`));
    });
  });
}

/**
 * Fetch raw JSON metadata for a URL.
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
async function fetchMetadata(url) {
  const args = [
    '-J',
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--extractor-args', 'instagram:compatible_formats',
    url,
  ];

  const json = await runYtdlp(args, {
    timeoutMs: 45_000,
  });

  try {
    return JSON.parse(json);
  } catch (parseErr) {
    logger.error('[yt-dlp] Failed to parse JSON output');
    throw new Error('Failed to parse media information from the server.');
  }
}

/**
 * Build the download argument list for yt-dlp.
 *
 * @param {object} opts
 * @param {string}  opts.url
 * @param {string}  opts.type       'video'|'audio'|'shorts'|'reel'|'post'
 * @param {string}  [opts.formatId] explicit format id
 * @param {string}  opts.outPath    output template (yt-dlp -o)
 */
function buildDownloadArgs({ url, type, formatId, outPath }) {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
  ];

  if (type === 'audio') {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (formatId) {
    // A specific format ID was requested. Still prefer an mp4 container.
    args.push('-f', `${formatId}+bestaudio[ext=m4a]/${formatId}`);
  } else {
    // If no explicit format ID, download the best pre-merged mp4 or webm. 
    // b[ext=mp4] ensures we get a format that mobile galleries can easily play.
    args.push('-f', 'b[ext=mp4]/b');
  }

  args.push(
    '--merge-output-format', 'mp4',
    '-o', outPath,
    url
  );

  return args;
}

/**
 * Parse yt-dlp stderr progress lines into a 0–100 integer.
 * Example line: "[download]  65.3% of 45.67MiB at 2.34MiB/s ETA 00:15"
 */
function parseProgress(line) {
  const match = line.match(/\[download\]\s+([\d.]+)%/);
  if (match) return Math.floor(parseFloat(match[1]));
  return null;
}

module.exports = { runYtdlp, fetchMetadata, buildDownloadArgs, parseProgress };
