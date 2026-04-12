/**
 * Unified Media Service
 *
 * All API calls go through the backend — no mock data, no fallbacks.
 * The backend handles both YouTube and Instagram via /api/preview and /api/download.
 *
 * Completely stateless — no localStorage, no sessionStorage, no user tracking.
 */
import axiosInstance from '../utils/axiosInstance';
import API_ENDPOINTS from '../utils/apiEndpoints';

/**
 * Fetch media preview from the backend
 * @param {string} url - YouTube or Instagram URL
 * @param {AbortSignal} signal - Optional AbortController signal for cancellation
 * @returns {Promise<object>} Preview data with title, thumbnail, duration, formats
 */
export const fetchPreview = async (url, signal) => {
  const response = await axiosInstance.post(
    API_ENDPOINTS.preview,
    { url },
    { signal }
  );
  return response.data;
};

/**
 * Start a download job on the backend
 * @param {object} params - Download parameters
 * @param {string} params.url - Media URL
 * @param {string} params.platform - 'youtube' or 'instagram'
 * @param {string} params.type - 'video', 'shorts', 'reel', 'post', 'audio'
 * @param {string|null} params.formatId - Optional format ID for quality selection
 * @returns {Promise<object>} Job data with jobId
 */
export const startDownload = async ({ url, platform, type, formatId }) => {
  const response = await axiosInstance.post(API_ENDPOINTS.download, {
    url,
    platform,
    type,
    formatId: formatId || null,
  });
  return response.data;
};

/**
 * Check the status of a download job
 * @param {string} jobId - The job ID returned from startDownload
 * @returns {Promise<object>} Job status with status, progress, downloadUrl, error
 */
export const checkDownloadStatus = async (jobId) => {
  const response = await axiosInstance.get(API_ENDPOINTS.downloadStatus(jobId));
  return response.data;
};

/**
 * Trigger browser download via hidden anchor tag.
 * Handles both same-origin and cross-origin downloads.
 * Works on both mobile and desktop.
 *
 * @param {string} downloadUrl - The URL to download from
 * @param {string} filename - Suggested filename
 */
export const triggerBrowserDownload = (downloadUrl, filename) => {
  // Resolve the full URL for comparison
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  let fullUrl = downloadUrl;

  // If the downloadUrl is a relative path (starts with /), prefix it with the API base
  if (downloadUrl.startsWith('/') && apiBase) {
    fullUrl = `${apiBase}${downloadUrl}`;
  } else if (downloadUrl.startsWith('/')) {
    // In dev mode with proxy, relative URLs work as-is
    fullUrl = downloadUrl;
  }

  const link = document.createElement('a');
  link.href = fullUrl;
  link.download = filename || 'download';
  link.style.display = 'none';

  // For same-origin, download attribute works.
  // For cross-origin, set target=_blank as a fallback.
  const isSameOrigin =
    fullUrl.startsWith('/') ||
    fullUrl.startsWith(window.location.origin);

  if (isSameOrigin) {
    link.target = '_self';
  } else {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  document.body.appendChild(link);
  link.click();

  // Cleanup after a short delay
  setTimeout(() => {
    if (link.parentNode) {
      document.body.removeChild(link);
    }
  }, 1500);
};
