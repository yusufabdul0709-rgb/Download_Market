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
 * Validates an Instagram URL
 */
export const isValidInstagramURL = (url) => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?instagram\.com\/stories\/[\w.]+\/\d+/,
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
};

/**
 * Validates any supported URL (YouTube or Instagram)
 */
export const isValidURL = (url) => {
  return isValidYouTubeURL(url) || isValidInstagramURL(url);
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
    if (trimmed.includes('/reel/') || trimmed.includes('/reels/')) return 'instagram-reels';
    if (trimmed.includes('/p/')) return 'instagram-post';
    return 'instagram';
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
