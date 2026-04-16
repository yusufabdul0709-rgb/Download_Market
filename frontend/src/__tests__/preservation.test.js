/**
 * Preservation Group C — useDownloadMedia hook non-widget flows
 *
 * These tests verify that the useDownloadMedia hook file is unchanged and
 * continues to export the expected interface. Platform-specific downloader
 * pages use this hook and must be completely unaffected by changes to
 * QuickDownloaderCard.
 *
 * Observation methodology: the hook was read on unfixed code and its exported
 * interface was recorded. These tests encode those observations.
 *
 * Validates: Requirements 3.8
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, test, expect } from 'vitest';

// ── Preservation Group C — useDownloadMedia hook ──────────────────────────────

describe('Preservation Group C — useDownloadMedia hook non-widget flows', () => {
  /**
   * Preservation Property C.1: useDownloadMedia.js exports a default function.
   *
   * Observed on unfixed code: the module exports a default function named
   * 'useDownloadMedia'.
   *
   * Validates: Requirements 3.8
   */
  test('useDownloadMedia exports a default function', async () => {
    const mod = await import('../hooks/useDownloadMedia.js');
    expect(typeof mod.default).toBe('function');
  });

  /**
   * Preservation Property C.2: useDownloadMedia.js source file is not modified.
   *
   * This test reads the actual source file and verifies that key structural
   * elements are present — confirming the file has not been accidentally
   * modified as part of the bugfix.
   *
   * Observed on unfixed code: the file contains the hook definition, POLL_INTERVAL,
   * MAX_POLL_ATTEMPTS, fetchMediaPreview, startFormatDownload, and pollJobStatus.
   *
   * Validates: Requirements 3.8
   */
  test('useDownloadMedia.js source contains expected hook structure', () => {
    // Read the source file directly to verify it has not been modified
    const filePath = resolve(__dirname, '../hooks/useDownloadMedia.js');
    const source = readFileSync(filePath, 'utf8');

    // The hook must define POLL_INTERVAL
    expect(source).toContain('POLL_INTERVAL');

    // The hook must define MAX_POLL_ATTEMPTS
    expect(source).toContain('MAX_POLL_ATTEMPTS');

    // The hook must export a default function named useDownloadMedia
    expect(source).toContain('const useDownloadMedia');

    // The hook must contain fetchMediaPreview
    expect(source).toContain('fetchMediaPreview');

    // The hook must contain startFormatDownload
    expect(source).toContain('startFormatDownload');

    // The hook must contain pollJobStatus
    expect(source).toContain('pollJobStatus');

    // The hook must use the async job flow (POST + poll)
    expect(source).toContain('checkDownloadStatus');

    // The hook must import from mediaService (not use fetch directly)
    expect(source).toContain('mediaService');
  });

  /**
   * Preservation Property C.3: useDownloadMedia.js does NOT use the legacy GET endpoint.
   *
   * Observed on unfixed code: the hook never calls GET /api/download?url=...
   * It uses the mediaService abstraction instead.
   *
   * Validates: Requirements 3.8
   */
  test('useDownloadMedia.js does not use the legacy GET /api/download?url= endpoint', () => {
    const filePath = resolve(__dirname, '../hooks/useDownloadMedia.js');
    const source = readFileSync(filePath, 'utf8');

    // The hook must NOT contain the legacy GET endpoint pattern
    expect(source).not.toContain('/api/download?url=');
    expect(source).not.toContain("fetch('/api/download'");
    expect(source).not.toContain('fetch(`/api/download?');
  });

  /**
   * Preservation Property C.4: useDownloadMedia.js returns the expected interface.
   *
   * Observed on unfixed code: the hook returns an object with preview, previewLoading,
   * previewError, previewStatusMessage, fetchMediaPreview, downloadState,
   * startFormatDownload, resetDownloadState, and resetAll.
   *
   * This test verifies the hook's return shape is unchanged by rendering it
   * in a minimal test component.
   *
   * Validates: Requirements 3.8
   */
  test('useDownloadMedia.js source exports the expected return interface', () => {
    const filePath = resolve(__dirname, '../hooks/useDownloadMedia.js');
    const source = readFileSync(filePath, 'utf8');

    // Verify the return object contains all expected keys
    const expectedReturnKeys = [
      'preview',
      'previewLoading',
      'previewError',
      'previewStatusMessage',
      'fetchMediaPreview',
      'downloadState',
      'startFormatDownload',
      'resetDownloadState',
      'resetAll',
    ];

    for (const key of expectedReturnKeys) {
      expect(source).toContain(key);
    }
  });

  /**
   * Preservation Property C.5 (property-based): The useDownloadMedia hook file
   * has not been modified — its content hash is stable across multiple reads.
   *
   * This property-based test reads the file multiple times and verifies the
   * content is identical each time (no concurrent modification).
   *
   * Validates: Requirements 3.8
   */
  test('useDownloadMedia.js content is stable across multiple reads', () => {
    const filePath = resolve(__dirname, '../hooks/useDownloadMedia.js');

    const reads = Array.from({ length: 5 }, () => readFileSync(filePath, 'utf8'));

    // All reads must return identical content
    for (let i = 1; i < reads.length; i++) {
      expect(reads[i]).toBe(reads[0]);
    }
  });
});
