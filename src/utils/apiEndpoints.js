// API endpoints configuration — matches backend routes
const API_ENDPOINTS = {
  preview: '/api/preview',
  download: '/api/download',
  downloadStatus: (jobId) => `/api/download/${jobId}`,
  health: '/api/health',
};

export default API_ENDPOINTS;
