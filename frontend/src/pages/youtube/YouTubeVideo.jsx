import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Video } from 'lucide-react';
import { YoutubeIcon as Youtube } from '../../components/BrandIcons';
import URLInput from '../../components/URLInput';
import IframeAdBanner from '../../components/IframeAdBanner';
import PreviewCard from '../../components/PreviewCard';
import DownloadOptions from '../../components/DownloadOptions';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import HowToDownload from '../../components/HowToDownload';
import ToolFeatures from '../../components/ToolFeatures';
import SEOHead from '../../components/SEOHead';
import SEOFaq from '../../components/SEOFaq';
import useDownloadMedia from '../../hooks/useDownloadMedia';
import usePopunder from '../../hooks/usePopunder';

const YouTubeVideo = () => {
  const [url, setUrl] = useState('');
  const location = useLocation();
  const {
    preview,
    previewLoading,
    previewError,
    previewStatusMessage,
    fetchMediaPreview,
    downloadState,
    startFormatDownload,
    resetAll,
  } = useDownloadMedia();
  const triggerPopunder = usePopunder();

  // Handle URL passed from landing page
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
    if (!newUrl.trim()) {
      resetAll();
    }
  };

  const handleDownload = (downloadUrl, format) => {
    const adFired = triggerPopunder();
    if (adFired) {
      setTimeout(() => startFormatDownload(downloadUrl, format), 2000);
    } else {
      startFormatDownload(downloadUrl, format);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob-pink top-[-100px] right-[-100px]" />
      <div className="blob-blue bottom-[-100px] left-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        <SEOHead
          title="YouTube Video Downloader - Download HD Videos Free"
          description="Download YouTube videos in HD quality for free. No watermark, multiple formats (MP4, MP3). Save any YouTube video to your device instantly."
        />

        {/* ═══ 1. Title ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-youtube/10 border border-youtube/20 rounded-full text-youtube text-sm font-medium mb-4 shadow-sm">
            <Youtube size={18} />
            YouTube Video Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Download YouTube Videos in HD — Free & Fast
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Save YouTube videos in HD quality (360p to 1080p) or extract audio as MP3. No watermark, no signup.
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
            placeholder="Paste YouTube video URL here..."
            id="youtube-video-url-input"
          />
        </motion.div>

        {/* ═══ 3. Inline Ad (after input) 💰 ═══ */}
        <div className="mb-8" id="ad-inline">
          <IframeAdBanner id="ad-yt-video-inline" />
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
        {previewLoading && (
          <div className="space-y-6">
            <SkeletonLoader type="card" statusMessage={previewStatusMessage} />
            <SkeletonLoader type="download-options" />
          </div>
        )}

        {/* ═══ 4. Ad before result 💰💰 (VERY IMPORTANT) ═══ */}
        <AnimatePresence>
          {preview && !previewLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div id="ad-before-download" className="mb-2">
                <IframeAdBanner id="ad-yt-video-pre-result" />
              </div>

              {/* ═══ 5. Download Result ═══ */}
              <PreviewCard data={preview} />
              <DownloadOptions
                formats={preview.formats}
                url={url}
                onDownload={handleDownload}
                downloadState={downloadState}
              />

              {/* ═══ 6. Ad below result ═══ */}
              <div id="ad-after-download" className="mt-4">
                <IframeAdBanner id="ad-yt-video-bottom" />
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border border-youtube/10 shadow-lg shadow-youtube/5 flex items-center justify-center">
              <Video size={36} className="text-youtube/80" />
            </div>
            <h3 className="text-text-primary text-lg font-bold mb-2">No video loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste a YouTube video URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}

        {/* ═══ 7. How to Download Section ═══ */}
        <HowToDownload platform="YouTube Videos" />

        <ToolFeatures platform="YouTube Video Downloader" />

        <div className="flex justify-center my-6" id="ad-before-faq">
          <IframeAdBanner id="ad-yt-video-mid" />
        </div>

        <SEOFaq platform="YouTube Videos" />

        <div id="ad-footer" className="mt-8">
          <IframeAdBanner id="ad-yt-video-footer" />
        </div>

      </div>
    </div>
  );
};

export default YouTubeVideo;
