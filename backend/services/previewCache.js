'use strict';

const logger = require('../utils/logger');

/**
 * Enhanced Cache Service
 * Handles in-memory caching for media previews.
 * Can be easily extended to support Redis in production.
 */
class PreviewCache {
  constructor(ttlMs = 600_000) { // Default 10 minutes
    this.cache = new Map();
    this.ttl = ttlMs;
    this.activeRequests = new Map(); // Store promises to deduplicate active requests
  }

  /**
   * Get cached item if not expired
   */
  get(url) {
    const item = this.cache.get(url);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(url);
      return null;
    }

    return item.data;
  }

  /**
   * Set cache item
   */
  set(url, data) {
    this.cache.set(url, {
      data,
      timestamp: Date.now()
    });
    
    // Auto-cleanup after TTL
    setTimeout(() => this.cache.delete(url), this.ttl);
  }

  /**
   * Deduplicate active requests:
   * If the same URL is already being fetched, return the existing promise.
   */
  async getOrFetch(url, fetchFn) {
    // 1. Check completed cache
    const cached = this.get(url);
    if (cached) {
      logger.debug(`[Cache] HIT for ${url}`);
      return cached;
    }

    // 2. Check for active (in-flight) request for this URL
    if (this.activeRequests.has(url)) {
      logger.debug(`[Cache] DEDUPLICATED active request for ${url}`);
      return this.activeRequests.get(url);
    }

    // 3. Start new fetch and store its promise
    const fetchPromise = (async () => {
      try {
        const data = await fetchFn();
        this.set(url, data);
        return data;
      } finally {
        // Remove from active requests once done (success or fail)
        this.activeRequests.delete(url);
      }
    })();

    this.activeRequests.set(url, fetchPromise);
    return fetchPromise;
  }
}

// Singleton instance
module.exports = new PreviewCache();
