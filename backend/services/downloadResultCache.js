'use strict';

class DownloadResultCache {
  constructor(ttlMs = 15 * 60 * 1000) {
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  buildKey({ url, platform, type, formatId }) {
    return [url, platform, type, formatId || 'best'].join('|');
  }

  set(input, value) {
    const key = this.buildKey(input);
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
    });
    setTimeout(() => this.cache.delete(key), this.ttlMs);
  }

  get(input) {
    const key = this.buildKey(input);
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }
}

module.exports = new DownloadResultCache();
