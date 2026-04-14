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
export const triggerBrowserDownload = async (downloadUrl, filename) => {
  try {
    // Fetch the file as a Blob using the shared true axios instance
    const response = await axiosInstance.get(downloadUrl, {
      responseType: 'blob',
    });

    let finalFilename = filename || 'download';
    const disposition = response.headers['content-disposition'];
    
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(disposition);
      if (matches != null && matches[1]) {
        // Decode URI component in case it's encoded like RFC 5987
        try {
          finalFilename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
        } catch(e) {
          finalFilename = matches[1].replace(/['"]/g, '');
        }
      }
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', finalFilename);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Blob inline download failed, using standard fallback:', error);
    
    // Resolve full url for the fallback
    const apiBase = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = downloadUrl.startsWith('/') && apiBase ? `${apiBase}${downloadUrl}` : downloadUrl;
    
    const link = document.createElement('a');
    link.href = fullUrl;
    link.target = '_self'; // Prevents opening a ghost tab
    link.setAttribute('download', filename || 'download');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
