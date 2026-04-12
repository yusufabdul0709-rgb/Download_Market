import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — centralized error handling
axiosInstance.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status}`, response.data);
    }
    return response;
  },
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Something went wrong';
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.response?.status || 'Network Error'}`, message);
    }

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

export default axiosInstance;
