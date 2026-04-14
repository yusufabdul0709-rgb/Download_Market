import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon } from 'lucide-react';
import URLInput from '../../components/URLInput';
import IframeAdBanner from '../../components/IframeAdBanner';
import PreviewCard from '../../components/PreviewCard';
import DownloadOptions from '../../components/DownloadOptions';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import HowToDownload from '../../components/HowToDownload';
import useDownloadMedia from '../../hooks/useDownloadMedia';
import usePopunder from '../../hooks/usePopunder';

const InstagramPost = () => {
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background blobs */}
      <div className="blob-pink top-[-100px] left-[-100px]" />
      <div className="blob-violet bottom-[-100px] right-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        {/* ═══ 1. Title ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-instagram/10 border border-instagram/20 rounded-full text-instagram text-sm font-medium mb-4 shadow-sm">
            <ImageIcon size={18} />
            Instagram Post Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Download Instagram Posts
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Save photos, carousels, and video posts from Instagram in full quality.
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
            placeholder="Paste Instagram Post URL here..."
            id="instagram-post-url-input"
          />
        </motion.div>

        {/* ═══ 3. Inline Ad (after input) 💰 ═══ */}
        <div className="mb-8" id="ad-inline">
          <IframeAdBanner id="ad-ig-post-inline" />
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
        {previewLoading && <SkeletonLoader type="card" statusMessage={previewStatusMessage} />}

        {/* ═══ 4. Ad before result 💰💰 (VERY IMPORTANT) ═══ */}
        <AnimatePresence>
          {preview && !previewLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div id="ad-download-top" className="mb-2">
                <IframeAdBanner id="ad-ig-post-pre-result" />
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
              <div id="ad-download-bottom" className="mt-4">
                <IframeAdBanner id="ad-ig-post-bottom" />
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
              <ImageIcon size={36} className="text-instagram/80" />
            </div>
            <h3 className="text-text-primary text-lg font-bold mb-2">No Post loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste an Instagram Post URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}

        {/* ═══ 7. How to Download Section ═══ */}
        <HowToDownload platform="Instagram Posts" />

        {/* ═══ 8. Footer Ad ═══ */}
        <div id="ad-footer" className="mt-8">
          <IframeAdBanner id="ad-ig-post-footer" />
        </div>

      </div>
    </div>
  );
};

export default InstagramPost;
