'use strict';

const fetchWithRetry = require('../utils/fetchWithRetry');
const logger = require('../utils/logger');

const API_ENDPOINTS = [
  process.env.DOWNLOADER_API_1 || '',
  process.env.DOWNLOADER_API_2 || '',
  process.env.DOWNLOADER_API_3 || '',
].filter(Boolean);

function buildApiCall(endpoint) {
  return async (url) => {
    const target = `${endpoint}${endpoint.includes('?') ? '&' : '?'}url=${encodeURIComponent(url)}`;
    return fetchWithRetry(target, { method: 'GET' }, 2, 1000);
  };
}

const APIS = API_ENDPOINTS.map(buildApiCall);

async function getVideo(url) {
  if (!url) {
    return { success: false, message: 'URL required' };
  }

  if (APIS.length === 0) {
    return {
      success: false,
      message: 'All services failed. Try again later.',
      source: 'api1/api2/api3',
    };
  }

  for (let i = 0; i < APIS.length; i += 1) {
    try {
      const data = await APIS[i](url);
      if (data && data.success) {
        return {
          success: true,
          source: `API_${i + 1}`,
          data,
        };
      }
    } catch (err) {
      logger.warn(`[DownloaderService] API ${i + 1} failed`, { message: err.message });
    }
  }

  return {
    success: false,
    message: 'All services failed. Try again later.',
    source: 'api1/api2/api3',
  };
}

module.exports = getVideo;
