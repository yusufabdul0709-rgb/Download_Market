'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const axios = require('axios');
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
    '--geo-bypass', // Bypass geo-blocking if server is in a restricted region
    
    // Realistic browser User-Agent — makes yt-dlp look like Chrome, not a script
    '--user-agent', config.ytdlp.userAgent,
    
    // Mimic official YouTube App + Web player clients to bypass bot detection
    '--extractor-args', 'youtube:player_client=android,web,default',
    
    // Anti-Fingerprinting headers
    '--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    '--add-header', 'Accept-Language: en-US,en;q=0.5',
    '--add-header', 'Sec-Fetch-Mode: navigate',
    
    // Referer header — mimics navigation from YouTube itself
    '--referer', 'https://www.youtube.com/',
    
    // Retry internal extraction errors
    '--extractor-retries', '5',
  ];

  // Cookies are the MOST IMPORTANT part for anti-bot
  // On Render, we recommend uploading a cookies.txt file
  if (config.ytdlp.cookiesPath && fs.existsSync(config.ytdlp.cookiesPath)) {
    args.push('--cookies', config.ytdlp.cookiesPath);
    logger.debug(`[yt-dlp] Using cookies from ${config.ytdlp.cookiesPath}`);
  }

  if (config.ytdlp.proxy) {
    args.push('--proxy', config.ytdlp.proxy);
  }

  args.push('--extractor-args', 'instagram:compatible_formats');

  return args;
}

/**
 * Build the yt-dlp flags for actual download jobs.
 * Extends baseArgs() with rate-pacing sleep flags that are appropriate for
 * downloads but must NOT be present on metadata fetch invocations.
 *
 * @returns {string[]}
 */
function downloadArgs() {
  return [
    ...baseArgs(),
    '--sleep-interval', '2',
    '--max-sleep-interval', '5',
    '--sleep-requests', '2',
  ];
}

function fallbackArgs() {
  const args = baseArgs();
  const oldIndex = args.indexOf('youtube:player_client=android,web,default');
  if (oldIndex > -1) {
    args[oldIndex] = 'youtube:player_client=ios,android,web';
  } else {
    args.push('--extractor-args', 'youtube:player_client=ios,android,web');
  }
  args.push('--sleep-interval', '3', '--max-sleep-interval', '6');
  return args;
}

// ── URL normalisation ─────────────────────────────────────────────────────────

/**
 * Normalise media URLs before passing to yt-dlp
 * Unrolls Facebook share links and fixes YouTube Shorts.
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function normaliseMediaUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    // Fix YouTube Shorts
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) {
        const videoId = shortsMatch[1];
        const normalised = `https://www.youtube.com/watch?v=${videoId}`;
        logger.debug(`[yt-dlp] Normalised Shorts URL: ${url} → ${normalised}`);
        return normalised;
      }
    }

    // Unroll Facebook Share links
    if (hostname.includes('facebook.com') && parsed.pathname.startsWith('/share/')) {
      try {
        const res = await axios.get(url, {
          timeout: 9_000,
          maxRedirects: 10,
          headers: {
            'User-Agent': config.ytdlp.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
            'Sec-Fetch-Mode': 'navigate'
          }
        });
        if (res.request?.res?.responseUrl && res.request.res.responseUrl !== url) {
           logger.debug(`[yt-dlp] Unrolled FB Share: ${url} → ${res.request.res.responseUrl}`);
           return res.request.res.responseUrl;
        }
      } catch (err) {
        // Ignore unroll errors
        logger.debug(`[yt-dlp] Failed to unroll FB share link: ${err.message}`);
      }
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
  const normalisedUrl = await normaliseMediaUrl(url);

  return retryWithBackoff(
    async () => {
      const args = [
        ...baseArgs(),
        '-J',            // dump JSON
        normalisedUrl,
      ];

      const json = await runYtdlp(args, {
        timeoutMs: 30_000,
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

async function fetchMetadataWithFallback(url) {
  const normalisedUrl = await normaliseMediaUrl(url);

  const runExtractor = async (source, argsFactory) => {
    const data = await retryWithBackoff(
      async () => {
        const args = [...argsFactory(), '-J', normalisedUrl];
        const json = await runYtdlp(args, { timeoutMs: 30_000 });
        return JSON.parse(json);
      },
      {
        maxRetries: 2,
        initialDelay: 2_000,
        maxDelay: 8_000,
        shouldRetry: isRetryableError,
        label: `fetchMetadata-${source}`,
      }
    );
    return { data, source };
  };

  try {
    return await runExtractor('api1', baseArgs);
  } catch (api1Error) {
    logger.warn('[yt-dlp] api1 metadata fetch failed, trying api2 fallback', {
      error: api1Error.message,
    });
    try {
      return await runExtractor('api2', fallbackArgs);
    } catch (api2Error) {
      const combined = new Error(api2Error.message || api1Error.message || 'Metadata fetch failed.');
      combined.api1Error = api1Error;
      combined.api2Error = api2Error;
      throw combined;
    }
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
async function buildDownloadArgs({ url, type, formatId, outPath }) {
  const normalisedUrl = await normaliseMediaUrl(url);

  const args = [
    ...downloadArgs(),
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

module.exports = {
  runYtdlp,
  fetchMetadata,
  fetchMetadataWithFallback,
  buildDownloadArgs,
  parseProgress,
  normaliseMediaUrl,
  baseArgs,
  downloadArgs,
};
