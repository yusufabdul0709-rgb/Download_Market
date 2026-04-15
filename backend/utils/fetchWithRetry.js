'use strict';

const axios = require('axios');

async function fetchWithRetry(url, options = {}, retries = 2, delay = 1000) {
  try {
    const res = await axios(url, { timeout: 10_000, ...options });
    return res.data;
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    throw err;
  }
}

module.exports = fetchWithRetry;
