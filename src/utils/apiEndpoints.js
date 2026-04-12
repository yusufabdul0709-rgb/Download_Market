// API endpoints configuration — matches backend routes
const API_ENDPOINTS = {
  preview: '/api/preview',
  download: '/api/download',
  downloadStatus: (jobId) => `/api/download/${jobId}`,
  downloadFile: (jobId, filename) => `/api/download/file/${jobId}/${filename}`,
  health: '/api/health',
};

export default API_ENDPOINTS;
