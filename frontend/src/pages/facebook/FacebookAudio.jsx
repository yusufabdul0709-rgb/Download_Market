import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music } from 'lucide-react';
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

const FacebookAudio = () => {
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
    fetchMediaPreview(targetUrl, 'facebook', 'audio');
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
      <div className="blob-pink top-[-100px] right-[-100px]" />
      <div className="blob-blue bottom-[-100px] left-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        <SEOHead
          title="Convert Facebook to MP3 - Download FB Audio"
          description="Convert Facebook videos and reels to MP3 audio for free. High quality 320kbps audio extraction from Facebook content."
        />

        {/* ═══ Title ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-600 text-sm font-medium mb-4 shadow-sm">
            <Music size={18} />
            Facebook Audio Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Download <span className="text-blue-600 font-extrabold">Facebook Audio</span> — MP3 High Quality
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Extract high-quality audio from any Facebook video or reel. Just paste the link and get your MP3 instantly.
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
            placeholder="Paste Facebook Link here for Audio..."
            id="facebook-audio-url-input"
          />
        </motion.div>

        <div className="mb-8">
          <IframeAdBanner id="ad-fb-audio-inline" />
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
              <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-xl border border-slate-100 p-5 text-center">
                <PreviewCard data={preview} isVertical />
                <div className="mt-4">
                  <DownloadOptions
                    formats={preview.formats?.filter(f => f.format === 'mp3' || f.formatId === 'audio')}
                    url={url}
                    onDownload={handleDownload}
                    downloadState={downloadState}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <HowToDownload platform="Facebook Audio" />
        <ToolFeatures platform="Facebook MP3 Converter" />
        <SEOFaq platform="Facebook Audio" />
      </div>
    </div>
  );
};

export default FacebookAudio;
