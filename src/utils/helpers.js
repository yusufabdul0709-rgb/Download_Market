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
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Format duration from seconds
 */
export const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
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
 * Generate a unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};
