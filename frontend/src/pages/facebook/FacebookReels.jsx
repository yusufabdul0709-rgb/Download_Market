import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Heart, MessageCircle, Clock } from 'lucide-react';
import { FacebookIcon as Facebook } from '../../components/BrandIcons';
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

const FacebookReels = () => {
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
      <div className="blob-blue bottom-[-100px] right-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        <SEOHead
          title="Facebook Reels Downloader - Save Facebook Reels in HD Free"
          description="Download Facebook Reels in HD quality for free. No login required. Save any Facebook Reel video to your phone or computer instantly with Download Market."
        />

        {/* ═══ Title ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-600 text-sm font-medium mb-4 shadow-sm">
            <Facebook size={18} />
            Facebook Reels Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Download <span className="text-blue-600 font-extrabold">Facebook Reels</span> in HD — Free
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Save any Facebook Reel to your device in full HD quality. Fast, free, and no login required.
          </p>
        </motion.div>

        {/* ═══ Input Box ═══ */}
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
            placeholder="Paste Facebook Reel URL here..."
            id="facebook-reels-url-input"
          />
        </motion.div>

        {/* ═══ Ad placement ═══ */}
        <div className="mb-8" id="ad-inline">
          <IframeAdBanner id="ad-fb-reels-inline" />
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
          <div className="max-w-md mx-auto w-full space-y-4">
            <SkeletonLoader type="vertical-card" statusMessage={previewStatusMessage} />
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {preview && !previewLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div id="ad-before-download" className="mb-2">
                <IframeAdBanner id="ad-fb-reels-pre-result" />
              </div>

              <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-xl shadow-blue-500/10 border border-slate-100 overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/20">
                <PreviewCard data={preview} isVertical />
                
                <div className="p-4 sm:p-5 mt-1">
                  <DownloadOptions
                    formats={preview.formats}
                    url={url}
                    onDownload={handleDownload}
                    downloadState={downloadState}
                  />
                </div>
                
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100/60">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-3">
                    {preview.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                       <Clock size={14} className="text-blue-400" />
                       <span>{preview.duration > 0 ? `${preview.duration}s length` : 'Video'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div id="ad-after-download" className="mt-4">
                <IframeAdBanner id="ad-fb-reels-bottom" />
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border border-blue-100 shadow-lg shadow-blue-500/5 flex items-center justify-center">
              <Film size={36} className="text-blue-500/80" />
            </div>
            <h3 className="text-text-primary text-lg font-bold mb-2">No Facebook Reel loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste a Facebook Reel URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}

        <HowToDownload platform="Facebook Reels" />
        <ToolFeatures platform="Facebook Reels Downloader" />
        <SEOFaq platform="Facebook Reels" />

        <div id="ad-footer" className="mt-8">
          <IframeAdBanner id="ad-fb-reels-footer" />
        </div>

      </div>
    </div>
  );
};

export default FacebookReels;
