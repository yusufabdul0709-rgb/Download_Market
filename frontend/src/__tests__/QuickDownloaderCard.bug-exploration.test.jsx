/**
 * Bug 3 — QuickDownloaderCard Legacy GET Endpoint: Exploration Test
 *
 * This test documents and confirms the existence of Bug 3 in the unfixed code.
 * It encodes the EXPECTED (correct) behavior — it FAILS on unfixed code, confirming
 * the bug exists. After the fix is applied, this test should PASS.
 *
 * Validates: Requirements 3.1, 3.2, 2.8, 2.9
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import QuickDownloaderCard from '../components/QuickDownloaderCard';

describe('Bug 3 — QuickDownloaderCard Legacy GET Endpoint', () => {
  let fetchCalls;

  beforeEach(() => {
    fetchCalls = [];

    // Intercept all fetch calls and record them
    vi.stubGlobal('fetch', vi.fn(async (url, options = {}) => {
      fetchCalls.push({ url: String(url), method: options.method || 'GET', options });

      // Return a mock response so the component doesn't crash
      return {
        ok: true,
        json: async () => ({ jobId: 'test-job-123', status: 'queued' }),
      };
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 3 (Bug Condition): QuickDownloaderCard MUST use POST /api/download
   * with the URL in the request body, NOT GET /api/download?url=...
   *
   * On UNFIXED code: the component calls GET /api/download?url=... → this test FAILS
   * (confirming the bug: legacy GET endpoint is used instead of the async POST flow).
   *
   * Counterexample: fetch is called with:
   *   url = '/api/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ'
   *   method = 'GET'
   *
   * Validates: Requirements 3.1, 3.2, 2.8
   */
  test(
    'QuickDownloaderCard should POST to /api/download, not GET with ?url= query string (bug: it uses GET)',
    async () => {
      render(<QuickDownloaderCard />);

      // Set a URL in the input
      const input = screen.getByPlaceholderText(/paste video link/i);
      fireEvent.change(input, {
        target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
      });

      // Click the Download button
      const button = screen.getByRole('button', { name: /download/i });
      fireEvent.click(button);

      // Wait for fetch to be called
      await waitFor(() => {
        expect(fetchCalls.length).toBeGreaterThan(0);
      });

      const firstCall = fetchCalls[0];

      // After the fix: method should be POST
      // On unfixed code: method is GET → test FAILS (confirms bug)
      expect(firstCall.method).toBe('POST');

      // After the fix: URL should be /api/download (no query string)
      // On unfixed code: URL is /api/download?url=... → test FAILS (confirms bug)
      expect(firstCall.url).toBe('/api/download');
      expect(firstCall.url).not.toContain('?url=');
    }
  );

});
