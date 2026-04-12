'use strict';

const { spawn } = require('child_process');
const path = require('path');
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

    const proc = spawn(ytdlp, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      // On Windows, shell:true lets PATH resolution work correctly
      shell: process.platform === 'win32',
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
  const json = await runYtdlp(['-J', '--no-playlist', url], {
    timeoutMs: 30_000,
  });
  return JSON.parse(json);
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
  const args = ['--no-playlist'];

  if (type === 'audio') {
    // Audio extraction
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
  } else if (formatId) {
    // Explicit format requested by the user
    args.push('-f', formatId);
  } else {
    // Best video+audio merge, fallback to best single
    args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
  }

  // Embed subtitles / thumbnail are disabled for speed
  args.push(
    '--merge-output-format', 'mp4',
    '--no-warnings',
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
