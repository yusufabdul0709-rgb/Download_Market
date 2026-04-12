import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — centralized error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
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
      message = serverMessage || 'Invalid request. Please check the URL.';
    } else if (status === 404) {
      message = 'Media not found. The URL may be invalid or private.';
    } else if (status === 429) {
      message = 'Too many requests. Please wait a moment and try again.';
    } else if (status === 500) {
      message = serverMessage || 'Server error. Please try again later.';
    } else if (status === 503) {
      message = 'Service temporarily unavailable. Please try again later.';
    } else if (error.code === 'ECONNABORTED') {
      message = 'Request timed out. The server took too long to respond.';
    } else if (!error.response) {
      message = 'Cannot connect to server. Please check if the backend is running.';
    } else {
      message = serverMessage || 'Something went wrong. Please try again.';
    }

    if (import.meta.env.DEV) {
      console.error(`[API Error] ${status || 'Network'}`, message);
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
