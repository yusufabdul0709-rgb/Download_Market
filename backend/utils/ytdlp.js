'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const config = require('../config');
const logger = require('./logger');
const { retryWithBackoff, isRetryableError } = require('./retryHelper');

// ── Deno PATH injection ───────────────────────────────────────────────────────
// yt-dlp requires Deno as its JavaScript runtime to solve YouTube's anti-bot
// challenges. Deno installs to ~/.deno/bin which may not be in the inherited
// Node.js process PATH. We explicitly add it.
const DENO_BIN_DIR = path.join(os.homedir(), '.deno', 'bin');
const spawnEnv = { ...process.env };
if (fs.existsSync(DENO_BIN_DIR)) {
  const sep = process.platform === 'win32' ? ';' : ':';
  spawnEnv.PATH = `${DENO_BIN_DIR}${sep}${process.env.PATH || ''}`;
  logger.info(`[yt-dlp] Deno runtime found at ${DENO_BIN_DIR}`);
} else {
  logger.debug(`[yt-dlp] Deno not found at ${DENO_BIN_DIR} (optional)`);
}

// ── Shared base arguments ─────────────────────────────────────────────────────

/**
 * Build the common yt-dlp flags that should be present on EVERY invocation.
 * These flags are the primary defence against YouTube 429 / bot detection.
 *
 * @returns {string[]}
 */
function baseArgs() {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    // Realistic browser User-Agent — makes yt-dlp look like Chrome, not a script
    '--user-agent', config.ytdlp.userAgent,
    // Referer header — mimics navigation from YouTube itself
    '--referer', 'https://www.youtube.com/',
    // Retry transient HTTP errors internally
    '--extractor-retries', '3',
    // Pace requests — sleep 1–3 seconds between sub-requests
    '--sleep-interval', '1',
    '--max-sleep-interval', '3',
  ];

  // ── FREE RATE LIMIT BYPASS (YouTube) ──────────────────────────────────
  // Tells yt-dlp to pretend we are an official YouTube Mobile App (iOS/Android).
  // YouTube rarely blocks mobile APIs compared to web browsers.
  args.push('--extractor-args', 'youtube:player_client=ios,android,default');
  
  // Wait even longer if they do throttle us temporarily
  args.push('--sleep-requests', '1');

  // ── Cookies file (the #1 most important fix) ────────────────────────────
  // Without cookies, YouTube treats yt-dlp as an anonymous bot and aggressively
  // rate-limits it (HTTP 429). With cookies from a logged-in browser session,
  // YouTube sees a real user.
  if (config.ytdlp.cookiesPath && fs.existsSync(config.ytdlp.cookiesPath)) {
    args.push('--cookies', config.ytdlp.cookiesPath);
    logger.debug(`[yt-dlp] Using cookies from ${config.ytdlp.cookiesPath}`);
  }

  // ── Proxy (optional) ───────────────────────────────────────────────────
  if (config.ytdlp.proxy) {
    args.push('--proxy', config.ytdlp.proxy);
  }

  // ── Instagram-specific ─────────────────────────────────────────────────
  args.push('--extractor-args', 'instagram:compatible_formats');

  return args;
}

// ── URL normalisation ─────────────────────────────────────────────────────────

/**
 * Normalise YouTube Shorts URLs to standard /watch?v= format.
 * Shorts URLs sometimes cause extraction issues on certain yt-dlp versions.
 *
 * @param {string} url
 * @returns {string}
 */
function normaliseYouTubeUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Only touch YouTube domains
    if (!hostname.includes('youtube.com') && !hostname.includes('youtu.be')) {
      return url;
    }

    // Convert /shorts/VIDEO_ID → /watch?v=VIDEO_ID
    const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
    if (shortsMatch) {
      const videoId = shortsMatch[1];
      const normalised = `https://www.youtube.com/watch?v=${videoId}`;
      logger.debug(`[yt-dlp] Normalised Shorts URL: ${url} → ${normalised}`);
      return normalised;
    }

    return url;
  } catch {
    return url;
  }
}

// ── Core runner ───────────────────────────────────────────────────────────────

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
      env: spawnEnv,
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

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch raw JSON metadata for a URL.
 * Includes retry with backoff for transient 429 errors.
 *
 * @param {string} url
 * @returns {Promise<object>}
 */
async function fetchMetadata(url) {
  const normalisedUrl = normaliseYouTubeUrl(url);

  return retryWithBackoff(
    async () => {
      const args = [
        ...baseArgs(),
        '-J',            // dump JSON
        normalisedUrl,
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
    },
    {
      maxRetries: 2,
      initialDelay: 3_000,
      shouldRetry: isRetryableError,
      label: 'fetchMetadata',
    }
  );
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
  const normalisedUrl = normaliseYouTubeUrl(url);

  const args = [
    ...baseArgs(),
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
    normalisedUrl
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

module.exports = { runYtdlp, fetchMetadata, buildDownloadArgs, parseProgress, normaliseYouTubeUrl };
