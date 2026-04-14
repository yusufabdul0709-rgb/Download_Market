/**
 * Validates a YouTube URL
 */
export const isValidYouTubeURL = (url) => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
    /^(https?:\/\/)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
};

/**
 * Validates a Facebook URL
 */
export const isValidFacebookURL = (url) => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?facebook\.com\/.*/,
    /^(https?:\/\/)?(m\.)?facebook\.com\/.*/,
    /^(https?:\/\/)?fb\.watch\/.*/,
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
};

/**
 * Checks if an Instagram URL is a browse/collection page (not a downloadable post).
 * Examples: /reels/audio/123, /explore/tags/x, /reels/ (no shortcode)
 */
export const isInstagramBrowsePage = (url) => {
  const browsePatterns = [
    /instagram\.com\/reels\/audio\//i,
    /instagram\.com\/reels\/trending/i,
    /instagram\.com\/explore\//i,
    /instagram\.com\/reels\/?$/i,
    /instagram\.com\/reels\/\?/i,
  ];
  return browsePatterns.some((p) => p.test(url.trim()));
};

/**
 * Returns a user-friendly hint for unsupported Instagram URL types.
 */
export const getInstagramURLHint = (url) => {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('/reels/audio/')) {
    return 'This is an Instagram audio page, not a specific reel. Please open a reel that uses this audio and paste that URL instead (e.g. instagram.com/reel/ABC123/).';
  }
  if (trimmed.includes('/explore/')) {
    return 'Explore pages cannot be downloaded. Please paste a direct link to a specific post or reel.';
  }
  if (/\/reels\/?($|\?)/.test(trimmed)) {
    return 'This is the Reels browse page. Please paste a link to a specific reel (e.g. instagram.com/reel/ABC123/).';
  }
  return null;
};

/**
 * Validates an Instagram URL
 */
export const isValidInstagramURL = (url) => {
  // Reject browse/collection pages first
  if (isInstagramBrowsePage(url)) return false;

  const patterns = [
    /^(https?:\/\/)?(www\.)?instagram\.com\/p\/[\w-]+/,         // Posts
    /^(https?:\/\/)?(www\.)?instagram\.com\/reel\/[\w-]+/,      // Reels (singular)
    /^(https?:\/\/)?(www\.)?instagram\.com\/reels\/[\w-]+/,     // Reels (plural, specific shortcode)
    /^(https?:\/\/)?(www\.)?instagram\.com\/tv\/[\w-]+/,        // IGTV
    /^(https?:\/\/)?(www\.)?instagram\.com\/stories\/[\w.]+\/\d+/, // Stories
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
};

/**
 * Validates any supported URL (Instagram or Facebook)
 */
export const isValidURL = (url) => {
  return isValidYouTubeURL(url) || isValidInstagramURL(url) || isValidFacebookURL(url);
};

/**
 * Auto-detect platform from URL
 */
export const detectPlatform = (url) => {
  if (!url) return null;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    if (trimmed.includes('/shorts/')) return 'youtube-shorts';
    return 'youtube';
  }
  if (trimmed.includes('instagram.com')) {
    if (trimmed.includes('/reel/')) return 'instagram-reels';
    if (trimmed.includes('/reels/') && !trimmed.includes('/reels/audio/')) return 'instagram-reels';
    if (trimmed.includes('/p/')) return 'instagram-post';
    return 'instagram';
  }
  if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
    if (trimmed.includes('/reel/') || trimmed.includes('/reels/')) return 'facebook-reels';
    return 'facebook';
  }
  return null;
};

/**
 * Get platform display info
 */
export const getPlatformInfo = (url) => {
  const platform = detectPlatform(url);
  if (!platform) return { name: 'Unknown', type: 'video' };

  const map = {
    youtube: { name: 'YouTube', type: 'video', platform: 'youtube' },
    'youtube-shorts': { name: 'YouTube Shorts', type: 'shorts', platform: 'youtube' },
    'instagram-reels': { name: 'Instagram Reels', type: 'reel', platform: 'instagram' },
    'instagram-post': { name: 'Instagram Post', type: 'post', platform: 'instagram' },
    instagram: { name: 'Instagram', type: 'reel', platform: 'instagram' },
    'facebook-reels': { name: 'Facebook Reels', type: 'reel', platform: 'facebook' },
    facebook: { name: 'Facebook', type: 'video', platform: 'facebook' },
  };

  return map[platform] || { name: 'Unknown', type: 'video', platform: 'unknown' };
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format duration from seconds
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Truncate text
 */
export const truncateText = (text, maxLength = 60) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

/**
 * Debounce utility
 */
export const debounce = (fn, delay) => {
  let timeoutId;
  const debounced = (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
};
