import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Youtube, Video, AlertCircle } from 'lucide-react';
import URLInput from '../../components/URLInput';
import PreviewCard from '../../components/PreviewCard';
import DownloadOptions from '../../components/DownloadOptions';
import Loader from '../../components/Loader';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import { fetchYouTubeVideo } from '../../services/youtubeService';
import { isValidYouTubeURL } from '../../utils/helpers';
import useFetchMedia from '../../hooks/useFetchMedia';
import toast from 'react-hot-toast';

const YouTubeVideo = () => {
  const [url, setUrl] = useState('');
  const { data, loading, error, fetchMedia, reset } = useFetchMedia();
  const location = useLocation();

  // Handle URL passed from landing page
  useEffect(() => {
    if (location.state?.url) {
      setUrl(location.state.url);
      handleFetch(location.state.url);
    }
  }, [location.state]);

  const handleFetch = async (inputUrl) => {
    const targetUrl = inputUrl || url;
    if (!targetUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    if (!isValidYouTubeURL(targetUrl)) {
      toast.error('Please enter a valid YouTube video URL');
      return;
    }
    await fetchMedia(fetchYouTubeVideo, targetUrl);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-youtube/5 to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-youtube/10 rounded-full text-youtube text-sm font-medium mb-4">
            <Youtube size={18} />
            YouTube Video Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Download YouTube Videos
          </h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Paste a YouTube video URL to preview and download in your preferred quality.
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
            onChange={setUrl}
            onSubmit={handleFetch}
            loading={loading}
            placeholder="Paste YouTube video URL here..."
            id="youtube-video-url-input"
          />
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <div className="mb-6">
              <ErrorMessage
                message={error}
                onRetry={() => handleFetch()}
                onDismiss={reset}
              />
            </div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="space-y-6">
            <SkeletonLoader type="card" />
            <SkeletonLoader type="download-options" />
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              <PreviewCard data={data} />
              <DownloadOptions formats={data.formats} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!data && !loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-youtube/10 flex items-center justify-center">
              <Video size={36} className="text-youtube/60" />
            </div>
            <h3 className="text-white/60 text-lg font-medium mb-2">No video loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste a YouTube video URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default YouTubeVideo;
