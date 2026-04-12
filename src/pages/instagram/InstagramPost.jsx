import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import URLInput from '../../components/URLInput';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import Button from '../../components/Button';
import { fetchInstagramPost } from '../../services/instagramService';
import { isValidInstagramURL } from '../../utils/helpers';
import useFetchMedia from '../../hooks/useFetchMedia';
import toast from 'react-hot-toast';

const InstagramPost = () => {
  const [url, setUrl] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
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
      toast.error('Please enter a valid Instagram Post URL');
      return;
    }
    setCurrentSlide(0);
    await fetchMedia(fetchInstagramPost, targetUrl);
  };

  const nextSlide = () => {
    if (data?.mediaItems) {
      setCurrentSlide((prev) => (prev + 1) % data.mediaItems.length);
    }
  };

  const prevSlide = () => {
    if (data?.mediaItems) {
      setCurrentSlide((prev) => (prev - 1 + data.mediaItems.length) % data.mediaItems.length);
    }
  };

  const handleDownloadItem = (item) => {
    toast.success(`Download started: ${item.type === 'video' ? 'Video' : 'Image'} ${item.id}`);
  };

  const handleDownloadAll = () => {
    toast.success('Downloading all media items...');
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
            <ImageIcon size={18} />
            Instagram Post Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Download Instagram Posts
          </h1>
          <p className="text-text-secondary max-w-lg mx-auto">
            Save images, carousels, and video posts from Instagram.
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
            placeholder="Paste Instagram Post URL here..."
            id="instagram-post-url-input"
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
        {loading && <SkeletonLoader type="card" />}

        {/* Results */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Post info */}
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  {data.userAvatar && (
                    <img
                      src={data.userAvatar}
                      alt={data.username}
                      className="w-10 h-10 rounded-full border-2 border-bg-surface-light"
                    />
                  )}
                  <div>
                    <p className="text-white font-semibold">@{data.username}</p>
                    <p className="text-text-muted text-sm">
                      {data.type === 'carousel' ? `Carousel • ${data.mediaItems?.length} items` : 'Single Post'}
                    </p>
                  </div>
                </div>
                {data.caption && (
                  <p className="text-text-secondary text-sm leading-relaxed">{data.caption}</p>
                )}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
                  {data.likes && <span className="text-text-muted text-sm">❤️ {data.likes}</span>}
                  {data.comments && <span className="text-text-muted text-sm">💬 {data.comments}</span>}
                </div>
              </div>

              {/* Carousel */}
              {data.mediaItems && data.mediaItems.length > 0 && (
                <div className="glass rounded-2xl overflow-hidden">
                  {/* Image viewport */}
                  <div className="relative aspect-square bg-bg-surface">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentSlide}
                        src={data.mediaItems[currentSlide].url}
                        alt={`Slide ${currentSlide + 1}`}
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>

                    {/* Type badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium uppercase">
                      {data.mediaItems[currentSlide].type}
                    </div>

                    {/* Navigation arrows */}
                    {data.mediaItems.length > 1 && (
                      <>
                        <button
                          onClick={prevSlide}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={nextSlide}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}

                    {/* Dots indicator */}
                    {data.mediaItems.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {data.mediaItems.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                              idx === currentSlide
                                ? 'bg-white w-5'
                                : 'bg-white/40 hover:bg-white/60'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Download current + all */}
                  <div className="p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <Button
                      variant="primary"
                      icon={Download}
                      onClick={() => handleDownloadItem(data.mediaItems[currentSlide])}
                      className="flex-1"
                      id="download-current-item"
                    >
                      Download This {data.mediaItems[currentSlide].type === 'video' ? 'Video' : 'Image'}
                    </Button>
                    {data.mediaItems.length > 1 && (
                      <Button
                        variant="secondary"
                        icon={Download}
                        onClick={handleDownloadAll}
                        className="flex-1"
                        id="download-all-items"
                      >
                        Download All ({data.mediaItems.length})
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Thumbnail grid */}
              {data.mediaItems && data.mediaItems.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {data.mediaItems.map((item, idx) => (
                    <motion.button
                      key={item.id}
                      onClick={() => setCurrentSlide(idx)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                        idx === currentSlide
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-white/20'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img
                        src={item.thumbnail}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {item.type === 'video' && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">▶</span>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
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
              <ImageIcon size={36} className="text-instagram/60" />
            </div>
            <h3 className="text-white/60 text-lg font-medium mb-2">No Post loaded</h3>
            <p className="text-text-muted text-sm max-w-md mx-auto">
              Paste an Instagram Post URL above and click Fetch to preview and download.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default InstagramPost;
