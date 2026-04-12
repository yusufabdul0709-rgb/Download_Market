import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — ready for JWT auth
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log outgoing requests in development
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
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${error.response?.status || 'Network Error'}`, message);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Could redirect to login here
    }

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

export default axiosInstance;
