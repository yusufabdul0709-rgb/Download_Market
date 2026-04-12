/**
 * Unified Media Service
 *
 * All API calls go through the backend — no mock data, no fallbacks.
 * The backend handles both YouTube and Instagram via /api/preview and /api/download.
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
 * Trigger browser download via hidden anchor tag
 * @param {string} downloadUrl - The URL to download from
 * @param {string} filename - Suggested filename
 */
export const triggerBrowserDownload = (downloadUrl, filename) => {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  link.style.display = 'none';
  // Same-origin downloads
  if (downloadUrl.startsWith('/') || downloadUrl.startsWith(window.location.origin)) {
    link.target = '_self';
  } else {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  document.body.appendChild(link);
  link.click();
  // Cleanup after a short delay
  setTimeout(() => {
    document.body.removeChild(link);
  }, 1000);
};
