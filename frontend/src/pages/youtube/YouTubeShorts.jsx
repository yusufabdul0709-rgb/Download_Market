import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Heart, MessageCircle, Clock, Film } from 'lucide-react';
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

const YouTubeShorts = () => {
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
      <div className="blob-violet top-[-100px] right-[-100px]" />
      <div className="blob-pink bottom-[-100px] left-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        <SEOHead
          title="YouTube Shorts Downloader - Save Shorts in HD Free"
          description="Download YouTube Shorts in HD quality for free. Save vertical short videos to your phone or computer. No watermark, no signup required."
        />

        {/* ═══ 1. Title ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-youtube/10 border border-youtube/20 rounded-full text-youtube text-sm font-medium mb-4 shadow-sm">
            <Scissors size={18} />
            YouTube Shorts Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Download <span class="gradient-text">YouTube Shorts</span> in HD — Free & Fast
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Save YouTube Shorts videos in HD quality. No watermark, works on all devices, completely free.
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
            placeholder="Paste YouTube Shorts URL here..."
            id="youtube-shorts-url-input"
          />
        </motion.div>

        {/* ═══ 3. Inline Ad (after input) 💰 ═══ */}
        <div className="mb-8" id="ad-inline">
          <IframeAdBanner id="ad-yt-shorts-inline" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <SkeletonLoader type="vertical-card" statusMessage={previewStatusMessage} />
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
                <IframeAdBanner id="ad-yt-shorts-pre-result" />
              </div>

              {/* ═══ 5. Download Result ═══ */}
              <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-xl shadow-indigo-500/10 border border-slate-100 overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
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
                  {preview.title || preview.caption ? (
                     <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-3">
                       {preview.title || preview.caption}
                     </h3>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                       <Clock size={14} className="text-indigo-400" />
                       <span>{preview.duration > 0 ? `${preview.duration}s length` : 'Recent short'}</span>
                    </div>
                    {(preview.viewCount || preview.views) && (
                      <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                         <Film size={14} className="text-pink-400" />
                         <span>{preview.views || (preview.viewCount ? `${(preview.viewCount / 1000000).toFixed(1)}M` : '')} views</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                       <Heart size={14} className="text-rose-400" />
                       <span>{(preview.viewCount ? Math.floor(preview.viewCount * 0.05) : 0).toLocaleString()} likes</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white shadow-sm border border-slate-100">
                       <MessageCircle size={14} className="text-sky-400" />
                       <span>{(preview.viewCount ? Math.floor(preview.viewCount * 0.002) : 0).toLocaleString()} cmts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ 6. Ad below result ═══ */}
              <div id="ad-after-download" className="mt-4">
                <IframeAdBanner id="ad-yt-shorts-bottom" />
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
              <Scissors size={36} className="text-youtube/80" />
            </div>
            <h3 className="text-text-primary text-lg font-bold mb-2">No Shorts loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste a YouTube Shorts URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}

        {/* ═══ 7. How to Download Section ═══ */}
        <HowToDownload platform="YouTube Shorts" />

        <ToolFeatures platform="YouTube Shorts Downloader" />

        <div className="flex justify-center my-6" id="ad-before-faq">
          <IframeAdBanner id="ad-yt-shorts-mid" />
        </div>

        <SEOFaq platform="YouTube Shorts" />

        <div id="ad-footer" className="mt-8">
          <IframeAdBanner id="ad-yt-shorts-footer" />
        </div>

      </div>
    </div>
  );
};

export default YouTubeShorts;
