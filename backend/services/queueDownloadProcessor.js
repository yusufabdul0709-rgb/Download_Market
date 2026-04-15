'use strict';

const getVideo = require('./downloader');
const {
  getCachedResult,
  setCachedResult,
  clearInflightJobId,
} = require('./jobResultStore');

async function processVideoJob({ url }) {
  const cached = await getCachedResult(url);
  if (cached) {
    return {
      success: true,
      cached: true,
      data: cached,
    };
  }

  const result = await getVideo(url);
  if (result?.success) {
    await setCachedResult(url, result.data);
  }
  await clearInflightJobId(url);
  return result;
}

module.exports = { processVideoJob };
