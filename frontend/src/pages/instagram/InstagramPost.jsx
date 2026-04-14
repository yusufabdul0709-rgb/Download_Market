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
import ToolFeatures from '../../components/ToolFeatures';
import SEOHead from '../../components/SEOHead';
import SEOFaq from '../../components/SEOFaq';
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

        <SEOHead
          title="Instagram Post Downloader - Save Photos & Videos Free"
          description="Download Instagram posts, photos and carousels in full quality. Save images and videos from Instagram for free. No watermark, no login required."
        />

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
            Download Instagram Posts — Photos & Videos Free
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Save photos, carousels, and videos from Instagram posts in full HD quality. No watermark, no signup.
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
              <div id="ad-before-download" className="mb-2">
                <IframeAdBanner id="ad-ig-post-pre-result" />
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
                       <span>{preview.duration > 0 ? `${preview.duration}s length` : 'Recent post'}</span>
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

        <ToolFeatures platform="Instagram Post Downloader" />

        <div className="flex justify-center my-6" id="ad-before-faq">
          <IframeAdBanner id="ad-ig-post-mid" />
        </div>

        <SEOFaq platform="Instagram Posts" />

        <div id="ad-footer" className="mt-8">
          <IframeAdBanner id="ad-ig-post-footer" />
        </div>

      </div>
    </div>
  );
};

export default InstagramPost;
