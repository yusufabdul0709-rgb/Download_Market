'use strict';

const axios = require('axios');
const {
  getProxyAgent,
  markSuccess,
  markFailure,
} = require('./proxyManager');

async function fetchWithRetry(url, options = {}, retries = 2, delay = 1000) {
  const { agent, proxyUrl } = getProxyAgent();

  try {
    const res = await axios(url, {
      timeout: 10_000,
      ...(agent ? { httpsAgent: agent, httpAgent: agent } : {}),
      ...options,
    });
    markSuccess(proxyUrl);
    return res.data;
  } catch (err) {
    markFailure(proxyUrl);
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay);
    }
    throw err;
  }
}

module.exports = fetchWithRetry;
