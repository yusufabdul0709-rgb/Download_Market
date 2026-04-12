import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film } from 'lucide-react';
import URLInput from '../../components/URLInput';
import PreviewCard from '../../components/PreviewCard';
import DownloadOptions from '../../components/DownloadOptions';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import { fetchInstagramReel } from '../../services/instagramService';
import { isValidInstagramURL } from '../../utils/helpers';
import useFetchMedia from '../../hooks/useFetchMedia';
import toast from 'react-hot-toast';

const InstagramReels = () => {
  const [url, setUrl] = useState('');
  const { data, loading, error, fetchMedia, reset } = useFetchMedia();
  const location = useLocation();

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
    if (!isValidInstagramURL(targetUrl)) {
      toast.error('Please enter a valid Instagram Reel URL');
      return;
    }
    await fetchMedia(fetchInstagramReel, targetUrl);
  };

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
            <Film size={18} />
            Instagram Reels Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Download Instagram Reels
          </h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Save Instagram Reels in full quality. Vertical video optimized.
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
            placeholder="Paste Instagram Reel URL here..."
            id="instagram-reels-url-input"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <SkeletonLoader type="vertical-card" />
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
              className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start"
            >
              <PreviewCard data={data} isVertical />
              <DownloadOptions formats={data.formats} url={url} />
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
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-instagram/10 flex items-center justify-center">
              <Film size={36} className="text-instagram/60" />
            </div>
            <h3 className="text-white/60 text-lg font-medium mb-2">No Reel loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste an Instagram Reel URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InstagramReels;
