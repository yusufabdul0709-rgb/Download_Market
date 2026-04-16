'use strict';

/**
 * Preservation Property Tests
 *
 * These tests encode the observed non-buggy behavior of the unfixed code for
 * inputs that do NOT trigger any of the three bug conditions. They PASS on
 * unfixed code (establishing a baseline) and MUST CONTINUE TO PASS after the
 * fixes are applied (preventing regressions).
 *
 * Observation methodology: each test group was written by calling the real
 * function on unfixed code and recording the output, then encoding those
 * observations as assertions.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 */

// ── Preservation Group A — baseArgs() anti-bot flags ─────────────────────────

describe('Preservation Group A — baseArgs() anti-bot flags', () => {
  let baseArgs;

  beforeAll(() => {
    jest.resetModules();
    ({ baseArgs } = require('../utils/ytdlp'));
  });

  /**
   * Preservation Property A.1: baseArgs() always returns an array.
   *
   * Observed on unfixed code: baseArgs() returns a non-empty array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() returns a non-empty array', () => {
    const args = baseArgs();
    expect(Array.isArray(args)).toBe(true);
    expect(args.length).toBeGreaterThan(0);
  });

  /**
   * Preservation Property A.2: baseArgs() always contains --user-agent.
   *
   * Observed on unfixed code: '--user-agent' is present in the returned array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --user-agent', () => {
    const args = baseArgs();
    expect(args).toContain('--user-agent');
  });

  /**
   * Preservation Property A.3: baseArgs() always contains Accept header.
   *
   * Observed on unfixed code: '--add-header' followed by 'Accept: ...' is present.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --add-header Accept:...', () => {
    const args = baseArgs();
    // Find the Accept header value
    const addHeaderIndices = [];
    args.forEach((arg, i) => {
      if (arg === '--add-header') addHeaderIndices.push(i);
    });
    const headerValues = addHeaderIndices.map((i) => args[i + 1] || '');
    const hasAccept = headerValues.some((v) => v.startsWith('Accept:') || v.startsWith('Accept '));
    expect(hasAccept).toBe(true);
  });

  /**
   * Preservation Property A.4: baseArgs() always contains Accept-Language header.
   *
   * Observed on unfixed code: '--add-header' followed by 'Accept-Language: ...' is present.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --add-header Accept-Language:...', () => {
    const args = baseArgs();
    const addHeaderIndices = [];
    args.forEach((arg, i) => {
      if (arg === '--add-header') addHeaderIndices.push(i);
    });
    const headerValues = addHeaderIndices.map((i) => args[i + 1] || '');
    const hasAcceptLanguage = headerValues.some(
      (v) => v.startsWith('Accept-Language:') || v.startsWith('Accept-Language ')
    );
    expect(hasAcceptLanguage).toBe(true);
  });

  /**
   * Preservation Property A.5: baseArgs() always contains Sec-Fetch-Mode header.
   *
   * Observed on unfixed code: '--add-header' followed by 'Sec-Fetch-Mode: ...' is present.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --add-header Sec-Fetch-Mode:...', () => {
    const args = baseArgs();
    const addHeaderIndices = [];
    args.forEach((arg, i) => {
      if (arg === '--add-header') addHeaderIndices.push(i);
    });
    const headerValues = addHeaderIndices.map((i) => args[i + 1] || '');
    const hasSecFetchMode = headerValues.some(
      (v) => v.startsWith('Sec-Fetch-Mode:') || v.startsWith('Sec-Fetch-Mode ')
    );
    expect(hasSecFetchMode).toBe(true);
  });

  /**
   * Preservation Property A.6: baseArgs() always contains --referer.
   *
   * Observed on unfixed code: '--referer' is present in the returned array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --referer', () => {
    const args = baseArgs();
    expect(args).toContain('--referer');
  });

  /**
   * Preservation Property A.7: baseArgs() always contains --extractor-args with
   * youtube:player_client=android,web,default.
   *
   * Observed on unfixed code: '--extractor-args' followed by
   * 'youtube:player_client=android,web,default' is present.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --extractor-args youtube:player_client=android,web,default', () => {
    const args = baseArgs();
    const extIdx = args.indexOf('--extractor-args');
    expect(extIdx).toBeGreaterThan(-1);
    expect(args[extIdx + 1]).toBe('youtube:player_client=android,web,default');
  });

  /**
   * Preservation Property A.8: baseArgs() always contains --extractor-retries 5.
   *
   * Observed on unfixed code: '--extractor-retries' followed by '5' is present.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --extractor-retries 5', () => {
    const args = baseArgs();
    const idx = args.indexOf('--extractor-retries');
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe('5');
  });

  /**
   * Preservation Property A.9: baseArgs() always contains --geo-bypass.
   *
   * Observed on unfixed code: '--geo-bypass' is present in the returned array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --geo-bypass', () => {
    const args = baseArgs();
    expect(args).toContain('--geo-bypass');
  });

  /**
   * Preservation Property A.10: baseArgs() always contains --no-playlist.
   *
   * Observed on unfixed code: '--no-playlist' is present in the returned array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --no-playlist', () => {
    const args = baseArgs();
    expect(args).toContain('--no-playlist');
  });

  /**
   * Preservation Property A.11: baseArgs() always contains --no-warnings.
   *
   * Observed on unfixed code: '--no-warnings' is present in the returned array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --no-warnings', () => {
    const args = baseArgs();
    expect(args).toContain('--no-warnings');
  });

  /**
   * Preservation Property A.12: baseArgs() always contains --no-check-certificates.
   *
   * Observed on unfixed code: '--no-check-certificates' is present in the returned array.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() always contains --no-check-certificates', () => {
    const args = baseArgs();
    expect(args).toContain('--no-check-certificates');
  });

  /**
   * Preservation Property A.13 (property-based): baseArgs() is deterministic —
   * calling it multiple times always returns arrays with the same anti-bot flags.
   *
   * This property-based test generates multiple calls and verifies consistency.
   *
   * Validates: Requirements 3.6
   */
  test('baseArgs() is deterministic — anti-bot flags are always present across multiple calls', () => {
    const REQUIRED_FLAGS = [
      '--user-agent',
      '--referer',
      '--extractor-retries',
      '--geo-bypass',
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--add-header',
      '--extractor-args',
    ];

    // Call baseArgs() 10 times and verify required flags are always present
    for (let i = 0; i < 10; i++) {
      const args = baseArgs();
      for (const flag of REQUIRED_FLAGS) {
        expect(args).toContain(flag);
      }
    }
  });
});

// ── Preservation Group B — buildJobArgs non-Instagram format selectors ────────

describe('Preservation Group B — buildJobArgs non-Instagram format selectors', () => {
  let buildJobArgs;

  beforeAll(() => {
    jest.resetModules();
    ({ buildJobArgs } = require('../controllers/downloadController'));
  });

  const TEST_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const OUT_TEMPLATE = '/tmp/test.%(ext)s';

  /**
   * Preservation Property B.1: YouTube video with no formatId uses bestvideo+bestaudio/best.
   *
   * Observed on unfixed code: buildJobArgs({ platform: 'youtube', type: 'video',
   *   formatId: null }) returns args containing '-f', 'bestvideo+bestaudio/best'.
   *
   * Validates: Requirements 3.5
   */
  test('buildJobArgs for youtube/video/no-formatId uses bestvideo+bestaudio/best', () => {
    const args = buildJobArgs({
      url: TEST_URL,
      type: 'video',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    const fIdx = args.indexOf('-f');
    expect(fIdx).toBeGreaterThan(-1);
    expect(args[fIdx + 1]).toBe('bestvideo+bestaudio/best');
  });

  /**
   * Preservation Property B.2: Facebook video with no formatId uses bestvideo+bestaudio/best.
   *
   * Observed on unfixed code: buildJobArgs({ platform: 'facebook', type: 'video',
   *   formatId: null }) returns args containing '-f', 'bestvideo+bestaudio/best'.
   *
   * Validates: Requirements 3.5
   */
  test('buildJobArgs for facebook/video/no-formatId uses bestvideo+bestaudio/best', () => {
    const args = buildJobArgs({
      url: 'https://www.facebook.com/video/123',
      type: 'video',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'facebook',
    });

    const fIdx = args.indexOf('-f');
    expect(fIdx).toBeGreaterThan(-1);
    expect(args[fIdx + 1]).toBe('bestvideo+bestaudio/best');
  });

  /**
   * Preservation Property B.3 (property-based): For all platforms ≠ 'instagram'
   * with type='video' and no formatId, format selector is always bestvideo+bestaudio/best.
   *
   * Observed on unfixed code: all non-Instagram platforms use the same format selector.
   *
   * Validates: Requirements 3.5
   */
  test('buildJobArgs for any non-instagram platform with type=video and no formatId always uses bestvideo+bestaudio/best', () => {
    const NON_INSTAGRAM_PLATFORMS = ['youtube', 'facebook', 'tiktok', 'twitter', 'vimeo', 'unknown'];

    for (const platform of NON_INSTAGRAM_PLATFORMS) {
      const args = buildJobArgs({
        url: TEST_URL,
        type: 'video',
        formatId: null,
        outTemplate: OUT_TEMPLATE,
        platform,
      });

      const fIdx = args.indexOf('-f');
      expect(fIdx).toBeGreaterThan(-1);
      expect(args[fIdx + 1]).toBe('bestvideo+bestaudio/best');
    }
  });

  /**
   * Preservation Property B.4: Instagram audio uses -x --audio-format mp3 --audio-quality 0.
   *
   * Observed on unfixed code: buildJobArgs({ platform: 'instagram', type: 'audio' })
   * returns args containing '-x', '--audio-format', 'mp3', '--audio-quality', '0'.
   *
   * Validates: Requirements 3.3
   */
  test('buildJobArgs for instagram/audio uses -x --audio-format mp3 --audio-quality 0', () => {
    const args = buildJobArgs({
      url: 'https://www.instagram.com/reel/abc/',
      type: 'audio',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'instagram',
    });

    expect(args).toContain('-x');
    expect(args).toContain('--audio-format');
    const afIdx = args.indexOf('--audio-format');
    expect(args[afIdx + 1]).toBe('mp3');
    expect(args).toContain('--audio-quality');
    const aqIdx = args.indexOf('--audio-quality');
    expect(args[aqIdx + 1]).toBe('0');
  });

  /**
   * Preservation Property B.5 (property-based): For any platform with type='audio',
   * args always contain -x --audio-format mp3 --audio-quality 0.
   *
   * Observed on unfixed code: audio type always triggers the audio extraction path.
   *
   * Validates: Requirements 3.3
   */
  test('buildJobArgs for any platform with type=audio always uses -x --audio-format mp3 --audio-quality 0', () => {
    const ALL_PLATFORMS = ['youtube', 'facebook', 'instagram', 'tiktok'];

    for (const platform of ALL_PLATFORMS) {
      const args = buildJobArgs({
        url: TEST_URL,
        type: 'audio',
        formatId: null,
        outTemplate: OUT_TEMPLATE,
        platform,
      });

      expect(args).toContain('-x');
      expect(args).toContain('--audio-format');
      const afIdx = args.indexOf('--audio-format');
      expect(args[afIdx + 1]).toBe('mp3');
      expect(args).toContain('--audio-quality');
      const aqIdx = args.indexOf('--audio-quality');
      expect(args[aqIdx + 1]).toBe('0');
    }
  });

  /**
   * Preservation Property B.6: formatId='audio' also triggers audio extraction.
   *
   * Observed on unfixed code: formatId='audio' is treated the same as type='audio'.
   *
   * Validates: Requirements 3.3
   */
  test('buildJobArgs with formatId=audio uses -x --audio-format mp3 --audio-quality 0', () => {
    const args = buildJobArgs({
      url: TEST_URL,
      type: 'video',
      formatId: 'audio',
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    expect(args).toContain('-x');
    expect(args).toContain('--audio-format');
    const afIdx = args.indexOf('--audio-format');
    expect(args[afIdx + 1]).toBe('mp3');
  });

  /**
   * Preservation Property B.7: YouTube with explicit formatId '137' uses 137+bestaudio/best.
   *
   * Observed on unfixed code: buildJobArgs({ platform: 'youtube', formatId: '137' })
   * returns args containing '-f', '137+bestaudio/best'.
   *
   * Validates: Requirements 3.4
   */
  test('buildJobArgs for youtube with explicit formatId 137 uses 137+bestaudio/best', () => {
    const args = buildJobArgs({
      url: TEST_URL,
      type: 'video',
      formatId: '137',
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    const fIdx = args.indexOf('-f');
    expect(fIdx).toBeGreaterThan(-1);
    expect(args[fIdx + 1]).toBe('137+bestaudio/best');
  });

  /**
   * Preservation Property B.8 (property-based): For any platform with an explicit
   * non-audio formatId, args always contain -f ${formatId}+bestaudio/best.
   *
   * Observed on unfixed code: explicit formatId always uses the combined format selector.
   *
   * Validates: Requirements 3.4
   */
  test('buildJobArgs for any platform with explicit non-audio formatId always uses ${formatId}+bestaudio/best', () => {
    const TEST_CASES = [
      { platform: 'youtube', formatId: '137' },
      { platform: 'youtube', formatId: '248' },
      { platform: 'facebook', formatId: '720p' },
      { platform: 'instagram', formatId: '1080p' },
    ];

    for (const { platform, formatId } of TEST_CASES) {
      const args = buildJobArgs({
        url: TEST_URL,
        type: 'video',
        formatId,
        outTemplate: OUT_TEMPLATE,
        platform,
      });

      const fIdx = args.indexOf('-f');
      expect(fIdx).toBeGreaterThan(-1);
      expect(args[fIdx + 1]).toBe(`${formatId}+bestaudio/best`);
    }
  });

  /**
   * Preservation Property B.9: buildJobArgs always includes --merge-output-format mp4.
   *
   * Observed on unfixed code: '--merge-output-format' followed by 'mp4' is always present.
   *
   * Validates: Requirements 3.5
   */
  test('buildJobArgs always includes --merge-output-format mp4', () => {
    const args = buildJobArgs({
      url: TEST_URL,
      type: 'video',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    const idx = args.indexOf('--merge-output-format');
    expect(idx).toBeGreaterThan(-1);
    expect(args[idx + 1]).toBe('mp4');
  });

  /**
   * Preservation Property B.10: buildJobArgs always includes the output template.
   *
   * Observed on unfixed code: '-o' followed by the outTemplate is always present.
   *
   * Validates: Requirements 3.5
   */
  test('buildJobArgs always includes -o with the output template', () => {
    const args = buildJobArgs({
      url: TEST_URL,
      type: 'video',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    const oIdx = args.indexOf('-o');
    expect(oIdx).toBeGreaterThan(-1);
    expect(args[oIdx + 1]).toBe(OUT_TEMPLATE);
  });

  /**
   * Preservation Property B.11: buildJobArgs always includes the URL as the last argument.
   *
   * Observed on unfixed code: the URL is always the last element in the args array.
   *
   * Validates: Requirements 3.5
   */
  test('buildJobArgs always includes the URL as the last argument', () => {
    const args = buildJobArgs({
      url: TEST_URL,
      type: 'video',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    expect(args[args.length - 1]).toBe(TEST_URL);
  });

  /**
   * Preservation Property B.12: buildJobArgs always includes all baseArgs() flags.
   *
   * Observed on unfixed code: the returned args array always starts with all baseArgs() flags.
   *
   * Validates: Requirements 3.6
   */
  test('buildJobArgs always includes all baseArgs() anti-bot flags', () => {
    jest.resetModules();
    const { buildJobArgs: bja } = require('../controllers/downloadController');
    const { baseArgs: ba } = require('../utils/ytdlp');

    const base = ba();
    const jobArgs = bja({
      url: TEST_URL,
      type: 'video',
      formatId: null,
      outTemplate: OUT_TEMPLATE,
      platform: 'youtube',
    });

    // Every flag in baseArgs() must appear in buildJobArgs() output
    for (const flag of base) {
      expect(jobArgs).toContain(flag);
    }
  });
});
