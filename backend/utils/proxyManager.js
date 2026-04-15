'use strict';

const { HttpsProxyAgent } = require('https-proxy-agent');
const logger = require('./logger');

const DISABLE_THRESHOLD = 3;
const COOLDOWN_MS = 5 * 60 * 1000;

const proxies = [process.env.PROXY_1, process.env.PROXY_2, process.env.PROXY_3]
  .filter(Boolean)
  .map((url) => ({
    url,
    failCount: 0,
    successCount: 0,
    disabled: false,
    disabledAt: null,
  }));

function recoverFromCooldown() {
  if (proxies.length === 0) return;
  const now = Date.now();
  for (const proxy of proxies) {
    if (proxy.disabled && proxy.disabledAt && now - proxy.disabledAt >= COOLDOWN_MS) {
      proxy.disabled = false;
      proxy.failCount = 0;
      proxy.disabledAt = null;
      logger.info(`[ProxyManager] Re-enabled proxy after cooldown: ${proxy.url}`);
    }
  }
}

function getBestProxy() {
  if (proxies.length === 0) return null;

  recoverFromCooldown();
  let active = proxies.filter((proxy) => !proxy.disabled);

  if (active.length === 0) {
    // Self-heal: if all proxies are down, reset and try again.
    for (const proxy of proxies) {
      proxy.disabled = false;
      proxy.failCount = 0;
      proxy.disabledAt = null;
    }
    active = proxies;
    logger.warn('[ProxyManager] All proxies were disabled. Resetting proxy pool.');
  }

  active.sort((a, b) => b.successCount - a.successCount);
  return active[0];
}

function markSuccess(proxyUrl) {
  if (!proxyUrl) return;
  const proxy = proxies.find((item) => item.url === proxyUrl);
  if (!proxy) return;
  proxy.successCount += 1;
  proxy.failCount = 0;
}

function markFailure(proxyUrl) {
  if (!proxyUrl) return;
  const proxy = proxies.find((item) => item.url === proxyUrl);
  if (!proxy) return;

  proxy.failCount += 1;
  if (proxy.failCount >= DISABLE_THRESHOLD) {
    proxy.disabled = true;
    proxy.disabledAt = Date.now();
    logger.warn(`[ProxyManager] Proxy disabled after failures: ${proxyUrl}`);
  }
}

function getProxyAgent() {
  const proxy = getBestProxy();
  if (!proxy) {
    return { agent: null, proxyUrl: null };
  }
  return {
    agent: new HttpsProxyAgent(proxy.url),
    proxyUrl: proxy.url,
  };
}

module.exports = {
  getProxyAgent,
  markSuccess,
  markFailure,
};
