'use strict';

const config = require('../config');

/**
 * Validate and normalise a submitted URL.
 *
 * @param {string} rawUrl
 * @returns {{ valid: boolean, url?: URL, platform?: string, error?: string }}
 */
function validateUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'URL is required.' };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS URLs are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const matched = config.supportedDomains.find((d) => hostname === d);

  if (!matched) {
    return {
      valid: false,
      error: `Unsupported domain "${hostname}". Supported: YouTube and Instagram.`,
    };
  }

  // Detect platform
  const platform = matched.includes('instagram') ? 'instagram' : 'youtube';

  return { valid: true, url: parsed, platform };
}

/**
 * Validate that the platform string is one we support.
 */
function validatePlatform(platform) {
  if (!platform || !config.supportedPlatforms.includes(platform)) {
    return {
      valid: false,
      error: `Unsupported platform. Allowed: ${config.supportedPlatforms.join(', ')}.`,
    };
  }
  return { valid: true };
}

/**
 * Validate the media type field.
 */
const ALLOWED_TYPES = ['video', 'shorts', 'reel', 'post', 'audio'];

function validateMediaType(type) {
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}.`,
    };
  }
  return { valid: true };
}

module.exports = { validateUrl, validatePlatform, validateMediaType };
