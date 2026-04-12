import { useState, useRef, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { fetchPreview, startDownload, checkDownloadStatus, triggerBrowserDownload } from '../services/mediaService';
import { isValidURL, getPlatformInfo } from '../utils/helpers';

const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 90; // 3 minutes max

/**
 * Custom hook for the complete download media flow:
 *  1. Validate URL
 *  2. Fetch preview from backend
 *  3. Start download job
 *  4. Poll for job completion
 *  5. Trigger browser download
 *
 * Stateless — no localStorage, no history tracking.
 */
const useDownloadMedia = () => {
  // Preview state
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Download state
  const [downloadState, setDownloadState] = useState({
    activeFormat: null,   // which format is currently downloading
    jobId: null,
    status: null,         // 'queued' | 'processing' | 'completed' | 'failed'
    progress: 0,
    error: null,
  });

  // Refs for cleanup
  const abortControllerRef = useRef(null);
  const pollTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  /**
   * Fetch media preview
   */
  const fetchMediaPreview = useCallback(async (url) => {
    // Validate
    if (!url?.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    if (!isValidURL(url.trim())) {
      setPreviewError('Unsupported URL. Please enter a valid YouTube or Instagram URL.');
      toast.error('Unsupported URL format');
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    resetDownloadState();

    try {
      const data = await fetchPreview(url.trim(), controller.signal);
      setPreview(data);
      toast.success('Media info loaded');
    } catch (err) {
      if (err.cancelled) return; // Silently ignore cancelled requests
      const message = err.message || 'Failed to fetch media info. Please try again.';
      setPreviewError(message);
      toast.error(message);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  /**
   * Start download for a specific format
   */
  const startFormatDownload = useCallback(async (url, format) => {
    if (!url || !format) return;

    const { platform, type } = getPlatformInfo(url);

    // Override type for audio formats
    const downloadType = format.format === 'mp3' ? 'audio' : type;

    setDownloadState({
      activeFormat: format.quality || format.formatId,
      jobId: null,
      status: 'queued',
      progress: 0,
      error: null,
    });

    try {
      const result = await startDownload({
        url: url.trim(),
        platform,
        type: downloadType,
        formatId: format.formatId || null,
      });

      if (result.jobId) {
        setDownloadState((prev) => ({
          ...prev,
          jobId: result.jobId,
          status: 'processing',
        }));
        toast('Download started, processing...', { icon: '⏳' });
        pollJobStatus(result.jobId, format);
      } else {
        // If backend returns a direct download URL
        if (result.downloadUrl) {
          triggerBrowserDownload(result.downloadUrl, result.filename);
          toast.success('Download started!');
          resetDownloadState();
        }
      }
    } catch (err) {
      const message = err.message || 'Failed to start download. Please try again.';
      setDownloadState((prev) => ({
        ...prev,
        status: 'failed',
        error: message,
        activeFormat: null,
      }));
      toast.error(message);
    }
  }, []);

  /**
   * Poll for job completion
   */
  const pollJobStatus = useCallback((jobId, format) => {
    let attempt = 0;

    const poll = async () => {
      attempt++;

      try {
        const result = await checkDownloadStatus(jobId);
        const { status, downloadUrl, progress, error, filename } = result;

        if (status === 'completed' && downloadUrl) {
          setDownloadState((prev) => ({
            ...prev,
            status: 'completed',
            progress: 100,
          }));
          toast.success(`Download ready: ${format.label || format.quality}`);
          triggerBrowserDownload(downloadUrl, filename || `download.${format.format || 'mp4'}`);

          // Reset after download trigger
          setTimeout(() => resetDownloadState(), 2000);
          return;
        }

        if (status === 'failed') {
          setDownloadState((prev) => ({
            ...prev,
            status: 'failed',
            error: error || 'Download failed on server.',
            activeFormat: null,
          }));
          toast.error(error || 'Download failed. Please try again.');
          return;
        }

        // Update progress
        setDownloadState((prev) => ({
          ...prev,
          status: status || 'processing',
          progress: progress || Math.min(attempt * 3, 90),
        }));

        if (attempt < MAX_POLL_ATTEMPTS) {
          pollTimerRef.current = setTimeout(poll, POLL_INTERVAL);
        } else {
          setDownloadState((prev) => ({
            ...prev,
            status: 'failed',
            error: 'Download timed out. Please try again.',
            activeFormat: null,
          }));
          toast.error('Download timed out. Please try again.');
        }
      } catch (err) {
        if (err.cancelled) return;

        // Retry on network errors
        if (attempt < MAX_POLL_ATTEMPTS) {
          pollTimerRef.current = setTimeout(poll, POLL_INTERVAL * 1.5);
        } else {
          setDownloadState((prev) => ({
            ...prev,
            status: 'failed',
            error: 'Lost connection to server.',
            activeFormat: null,
          }));
          toast.error('Lost connection while downloading. Please try again.');
        }
      }
    };

    poll();
  }, []);

  /**
   * Reset download state
   */
  const resetDownloadState = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    setDownloadState({
      activeFormat: null,
      jobId: null,
      status: null,
      progress: 0,
      error: null,
    });
  }, []);

  /**
   * Full reset — clears preview and download state
   */
  const resetAll = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
    }
    setPreview(null);
    setPreviewLoading(false);
    setPreviewError(null);
    resetDownloadState();
  }, [resetDownloadState]);

  return {
    // Preview
    preview,
    previewLoading,
    previewError,
    fetchMediaPreview,

    // Download
    downloadState,
    startFormatDownload,
    resetDownloadState,

    // General
    resetAll,
  };
};

export default useDownloadMedia;
