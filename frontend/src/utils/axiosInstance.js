import axios from 'axios';

/**
 * Axios instance for all API calls.
 *
 * - In DEVELOPMENT: VITE_API_BASE_URL is empty → requests go to '' (same origin)
 *   → Vite dev server proxy forwards /api/* to http://localhost:5000
 *
 * - In PRODUCTION: VITE_API_BASE_URL must be set to the deployed backend URL
 *   e.g. https://download-market-api.onrender.com
 *   → Requests go directly to that URL
 */
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API →] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — centralized error handling ────────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API ←] ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
    // Cancelled requests — swallow silently
    if (axios.isCancel(error)) {
      return Promise.reject({ cancelled: true, message: 'Request cancelled' });
    }

    const status = error.response?.status;
    const serverMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      null;

    let message;

    if (status === 400) {
      message = serverMessage || 'Invalid or unsupported URL. Please check and try again.';
    } else if (status === 401) {
      // Specifically for yt-dlp cookie requirements
      message = serverMessage || 'Authentication required to download this content. Please configure cookies.';
    } else if (status === 403) {
      message = serverMessage || 'This content is private or requires login.';
    } else if (status === 404) {
      message = serverMessage || 'Media not found. The URL may be invalid or private.';
    } else if (status === 410) {
      message = 'File has expired. Please start a new download.';
    } else if (status === 429) {
      message = serverMessage || 'Too many requests. Please wait a moment and try again.';
    } else if (status === 500) {
      message = serverMessage || 'Server error. Please try again later.';
    } else if (status === 502) {
      message = 'Server is currently offline or unreachable. Please verify the backend is running.';
    } else if (status === 503) {
      message = 'Download service is temporarily unavailable. Please try again later.';
    } else if (status === 504) {
      message = serverMessage || 'Server timed out. Please try again.';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. The server took too long to respond.';
    } else if (error.code === 'ERR_NETWORK' || !error.response) {
      message = 'Server not reachable. Please check your connection or try again later.';
    } else {
      message = serverMessage || 'Something went wrong. Please try again.';
    }

    // Always log errors in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] Status: ${status || 'Network'} | ${message}`);
      console.error('[API Error] Full error:', error);
    }

    return Promise.reject({
      status,
      message,
      data: error.response?.data,
      cancelled: false,
    });
  }
);

export default axiosInstance;
