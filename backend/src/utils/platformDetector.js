const url = require('url');

const SUPPORTED_DOMAINS = [
  'youtube.com', 'youtu.be',
  'facebook.com', 'fb.watch', 'instagram.com', 'twitter.com', 'x.com',
  'tiktok.com', 'vimeo.com', 'dailymotion.com', 'twitch.tv'
];

function detectPlatform(inputUrl) {
  try {
    const parsed = new URL(inputUrl);
    const hostname = parsed.hostname.toLowerCase();
    
    // Check against allowlist
    const isSupported = SUPPORTED_DOMAINS.some(domain => hostname.endsWith(domain));
    if (!isSupported) {
      return { valid: false, error: 'UNSUPPORTED_PLATFORM' };
    }

    let platform = 'generic';
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) platform = 'youtube';
    else if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) platform = 'facebook';
    else if (hostname.includes('instagram.com')) platform = 'instagram';
    else if (hostname.includes('twitter.com') || hostname.includes('x.com')) platform = 'twitter';
    else if (hostname.includes('tiktok.com')) platform = 'tiktok';

    return { valid: true, platform, parsedUrl: parsed };
  } catch (err) {
    return { valid: false, error: 'INVALID_URL' };
  }
}

module.exports = { detectPlatform, SUPPORTED_DOMAINS };
