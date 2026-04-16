'use strict';

/**
 * Bug Condition Exploration Tests
 *
 * These tests document and confirm the existence of three bugs in the unfixed code.
 * They encode the EXPECTED (correct) behavior — they FAIL on unfixed code, confirming
 * each bug exists. After the fixes are applied, these tests should PASS.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2
 */

// ── Bug 1 — Metadata Timeout ──────────────────────────────────────────────────

describe('Bug 1 — Metadata Timeout: baseArgs() sleep flags', () => {
  let baseArgs;

  beforeAll(() => {
    // Load the module fresh for each test group
    jest.resetModules();
    ({ baseArgs } = require('../utils/ytdlp'));
  });

  /**
   * Property 1 (Bug Condition): baseArgs() MUST NOT contain --sleep-interval.
   *
   * On UNFIXED code: baseArgs() DOES contain '--sleep-interval' → this test FAILS
   * (confirming the bug: sleep flags are present in shared args, consuming timeout budget).
   *
   * Counterexample: baseArgs() returns [..., '--sleep-interval', '2', ...]
   *
   * Validates: Requirements 1.3, 2.3
   */
  test('baseArgs() should NOT contain --sleep-interval (bug: it does)', () => {
    const args = baseArgs();
    expect(args).not.toContain('--sleep-interval');
  });

  /**
   * Property 1 (Bug Condition): baseArgs() MUST NOT contain --sleep-requests.
   *
   * On UNFIXED code: baseArgs() DOES contain '--sleep-requests' → this test FAILS
   * (confirming the ~4s sleep budget consumption).
   *
   * Counterexample: baseArgs() returns [..., '--sleep-requests', '2']
   *
   * Validates: Requirements 1.3, 2.3
   */
  test('baseArgs() should NOT contain --sleep-requests (bug: it does)', () => {
    const args = baseArgs();
    expect(args).not.toContain('--sleep-requests');
  });

  /**
   * Property 1 (Bug Condition): baseArgs() MUST NOT contain --max-sleep-interval.
   *
   * On UNFIXED code: baseArgs() DOES contain '--max-sleep-interval' → this test FAILS.
   *
   * Validates: Requirements 1.3, 2.3
   */
  test('baseArgs() should NOT contain --max-sleep-interval (bug: it does)', () => {
    const args = baseArgs();
    expect(args).not.toContain('--max-sleep-interval');
  });
});

/**
 * Bug 1 — Network test (requires yt-dlp + internet access).
 *
 * Run explicitly with: npm test -- --testNamePattern="fetchMetadataWithFallback"
 *
 * On UNFIXED code: fetchMetadataWithFallback times out at 9s (confirming Bug 1).
 * Observed counterexample: Error: 'yt-dlp timed out after 9s' (api1 attempt 1 and 2,
 * then api2 fallback also times out).
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 */
describe.skip('Bug 1 — Metadata Timeout: fetchMetadataWithFallback timeout (network test — run explicitly)', () => {
  /**
   * Property 1 (Bug Condition): fetchMetadataWithFallback with a YouTube URL and
   * timeoutMs: 9_000 MUST NOT throw a timeout error.
   *
   * On UNFIXED code: the function DOES throw 'yt-dlp timed out after 9s' → this test FAILS
   * (confirming the bug: sleep flags consume the 9s budget before network activity begins).
   *
   * Counterexample: fetchMetadataWithFallback('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
   *   throws Error: 'yt-dlp timed out after 9s'
   *
   * NOTE: This test actually invokes yt-dlp. It is scoped to the concrete failing case
   * (YouTube URL + 9s timeout) to ensure reproducibility.
   *
   * Validates: Requirements 1.1, 1.2, 2.1, 2.2
   */
  test(
    'fetchMetadataWithFallback should complete without timeout for YouTube URL (bug: it times out at 9s)',
    async () => {
      jest.resetModules();
      const { fetchMetadataWithFallback } = require('../utils/ytdlp');

      // We expect this to resolve (not throw a timeout error) after the fix.
      // On unfixed code it throws: Error: yt-dlp timed out after 9s
      await expect(
        fetchMetadataWithFallback('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      ).resolves.toBeDefined();
    },
    35_000 // allow up to 35s for the real network call
  );
});

// ── Bug 2 — Instagram Format Selection ───────────────────────────────────────

describe('Bug 2 — Instagram Format Selection: buildJobArgs format selector', () => {
  let buildJobArgs;

  beforeAll(() => {
    jest.resetModules();
    ({ buildJobArgs } = require('../controllers/downloadController'));
  });

  /**
   * Property 2 (Bug Condition): buildJobArgs for Instagram MUST use 'best[ext=mp4]/best',
   * NOT 'bestvideo+bestaudio/best'.
   *
   * On UNFIXED code: buildJobArgs returns args containing '-f', 'bestvideo+bestaudio/best'
   * for Instagram → this test FAILS (confirming the bug: platform-agnostic format selector
   * causes silent yt-dlp exit with no output file on Instagram).
   *
   * Counterexample: buildJobArgs({ url: 'https://www.instagram.com/reel/abc/', type: 'video',
   *   formatId: null, outTemplate: '/tmp/test.%(ext)s' })
   *   returns [..., '-f', 'bestvideo+bestaudio/best', ...]
   *
   * Validates: Requirements 2.1, 2.2, 2.5, 2.6
   */
  test(
    'buildJobArgs for Instagram should use best[ext=mp4]/best, not bestvideo+bestaudio/best (bug: it uses bestvideo+bestaudio/best)',
    () => {
      const args = buildJobArgs({
        url: 'https://www.instagram.com/reel/abc/',
        type: 'video',
        formatId: null,
        outTemplate: '/tmp/test.%(ext)s',
        platform: 'instagram',
      });

      const fIndex = args.indexOf('-f');
      expect(fIndex).toBeGreaterThan(-1);

      // After the fix, this should be 'best[ext=mp4]/best'
      // On unfixed code, this is 'bestvideo+bestaudio/best' → test FAILS
      expect(args[fIndex + 1]).toBe('best[ext=mp4]/best');
    }
  );

});
