import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Clock, User } from 'lucide-react';
import URLInput from '../../components/URLInput';
import DownloadOptions from '../../components/DownloadOptions';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import useDownloadMedia from '../../hooks/useDownloadMedia';
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
    <div className="min-h-screen relative">
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-instagram/5 to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-instagram/10 rounded-full text-instagram text-sm font-medium mb-4">
            <Music size={18} />
            Instagram Audio Extractor
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Extract Instagram Audio
          </h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Extract and download audio from Instagram Reels and videos as MP3.
          </p>
        </motion.div>

        {/* URL Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
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

        {/* Audio Preview + Download Options */}
        <AnimatePresence>
          {preview && !previewLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Audio info card */}
              <div className="glass rounded-2xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Cover art */}
                  {preview.thumbnail && (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl">
                      <img
                        src={preview.thumbnail}
                        alt={preview.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                          <Music size={20} className="text-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="text-center sm:text-left">
                    <h3 className="text-white font-bold text-lg mb-1">
                      {preview.title || 'Instagram Audio'}
                    </h3>
                    {preview.uploader && (
                      <p className="flex items-center justify-center sm:justify-start gap-1 text-text-muted text-sm">
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
                onDownload={startFormatDownload}
                downloadState={downloadState}
              />
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-instagram/10 flex items-center justify-center">
              <Music size={36} className="text-instagram/60" />
            </div>
            <h3 className="text-white/60 text-lg font-medium mb-2">No Audio loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste an Instagram URL above to extract and download its audio.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InstagramAudio;
