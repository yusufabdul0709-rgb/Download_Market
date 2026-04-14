import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Clock, User } from 'lucide-react';
import URLInput from '../../components/URLInput';
import IframeAdBanner from '../../components/IframeAdBanner';
import DownloadOptions from '../../components/DownloadOptions';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import HowToDownload from '../../components/HowToDownload';
import ToolFeatures from '../../components/ToolFeatures';
import SEOHead from '../../components/SEOHead';
import SEOFaq from '../../components/SEOFaq';
import useDownloadMedia from '../../hooks/useDownloadMedia';
import usePopunder from '../../hooks/usePopunder';
import { formatDuration } from '../../utils/helpers';

const InstagramAudio = () => {
  const [url, setUrl] = useState('');
  const location = useLocation();
  const {
    preview,
    previewLoading,
    previewError,
    fetchMediaPreview,
    downloadState,
    startFormatDownload,
    resetAll,
  } = useDownloadMedia();
  const triggerPopunder = usePopunder();

  useEffect(() => {
    if (location.state?.url) {
      setUrl(location.state.url);
      fetchMediaPreview(location.state.url);
    }
  }, [location.state, fetchMediaPreview]);

  const handleFetch = (inputUrl) => {
    const targetUrl = inputUrl || url;
    fetchMediaPreview(targetUrl);
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    if (!newUrl.trim()) resetAll();
  };

  const handleDownload = (downloadUrl, format) => {
    const adFired = triggerPopunder();
    if (adFired) {
      setTimeout(() => startFormatDownload(downloadUrl, format), 2000);
    } else {
      startFormatDownload(downloadUrl, format);
    }
  };

  // Build audio-only formats from preview data
  const audioFormats = preview?.formats
    ? preview.formats
        .filter((f) => f.format === 'mp3' || f.type === 'audio')
        .concat(
          // If no audio formats exist, create default options
          preview.formats.filter((f) => f.format === 'mp3' || f.type === 'audio').length === 0
            ? [
                { quality: '128kbps', format: 'mp3', label: 'MP3 128kbps', formatId: 'audio' },
                { quality: '320kbps', format: 'mp3', label: 'MP3 320kbps', formatId: 'audio_hq' },
              ]
            : []
        )
    : [];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob-pink top-[-100px] left-[-100px]" />
      <div className="blob-violet bottom-[-100px] right-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        <SEOHead
          title="Instagram Audio Extractor - Download Audio as MP3 Free"
          description="Extract and download audio from Instagram Reels and videos as MP3 for free. High quality audio extraction. No watermark, no signup."
        />

        {/* ═══ 1. Title ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-instagram/10 border border-instagram/20 rounded-full text-instagram text-sm font-medium mb-4 shadow-sm">
            <Music size={18} />
            Instagram Audio Extractor
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Extract Instagram Audio as MP3 — Free
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Extract and download audio from Instagram Reels and videos as high quality MP3. No watermark, no signup.
          </p>
        </motion.div>

        {/* ═══ 2. Input Box ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <URLInput
            value={url}
            onChange={handleUrlChange}
            onSubmit={handleFetch}
            loading={previewLoading}
            placeholder="Paste Instagram Reel/Video URL here..."
            id="instagram-audio-url-input"
          />
        </motion.div>

        {/* ═══ 3. Inline Ad (after input) 💰 ═══ */}
        <div className="mb-8" id="ad-inline">
          <IframeAdBanner id="ad-ig-audio-inline" />
        </div>

        {/* Error */}
        <AnimatePresence>
          {previewError && (
            <div className="mb-6">
              <ErrorMessage
                message={previewError}
                onRetry={() => handleFetch()}
                onDismiss={resetAll}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {previewLoading && <SkeletonLoader type="audio" />}

        {/* ═══ 4. Ad before result 💰💰 (VERY IMPORTANT) ═══ */}
        <AnimatePresence>
          {preview && !previewLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div id="ad-download-top" className="mb-2">
                <IframeAdBanner id="ad-ig-audio-pre-result" />
              </div>

              {/* ═══ 5. Download Result ═══ */}
              {/* Audio info card */}
              <div className="glass rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Cover art */}
                  {preview.thumbnail && (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg border border-primary/10">
                      <img
                        src={preview.thumbnail}
                        alt={preview.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                          <Music size={20} className="text-primary" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h3 className="text-text-primary font-bold text-lg mb-1">
                      {preview.title || 'Instagram Audio'}
                    </h3>
                    {preview.uploader && (
                      <p className="flex items-center justify-center sm:justify-start gap-1 text-text-secondary font-medium text-sm">
                        <User size={14} />
                        @{preview.uploader}
                      </p>
                    )}
                    {preview.duration > 0 && (
                      <p className="flex items-center justify-center sm:justify-start gap-1 text-text-muted text-xs mt-1">
                        <Clock size={12} />
                        {formatDuration(preview.duration)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Download audio formats */}
              <DownloadOptions
                formats={audioFormats.length > 0 ? audioFormats : preview.formats}
                url={url}
                onDownload={handleDownload}
                downloadState={downloadState}
              />

              {/* ═══ 6. Ad below result ═══ */}
              <div id="ad-download-bottom" className="mt-4">
                <IframeAdBanner id="ad-ig-audio-bottom" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!preview && !previewLoading && !previewError && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border border-instagram/10 shadow-lg shadow-instagram/5 flex items-center justify-center">
              <Music size={36} className="text-instagram/80" />
            </div>
            <h3 className="text-text-primary text-lg font-bold mb-2">No Audio loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste an Instagram URL above to extract and download its audio.
            </p>
          </motion.div>
        )}

        {/* ═══ 7. How to Download Section ═══ */}
        <HowToDownload platform="Instagram Audio" />

        <ToolFeatures platform="Instagram Audio Extractor" />

        <div className="flex justify-center my-6" id="ad-before-faq">
          <IframeAdBanner id="ad-ig-audio-mid" />
        </div>

        <SEOFaq platform="Instagram Audio" />

        <div id="ad-footer" className="mt-8">
          <IframeAdBanner id="ad-ig-audio-footer" />
        </div>

      </div>
    </div>
  );
};

export default InstagramAudio;
