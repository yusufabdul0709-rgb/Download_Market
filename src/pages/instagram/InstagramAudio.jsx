import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Play, Pause, Download, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import URLInput from '../../components/URLInput';
import DownloadOptions from '../../components/DownloadOptions';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import { fetchInstagramAudio } from '../../services/instagramService';
import { isValidInstagramURL, formatDuration } from '../../utils/helpers';
import useFetchMedia from '../../hooks/useFetchMedia';
import toast from 'react-hot-toast';

const InstagramAudio = () => {
  const [url, setUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const progressInterval = useRef(null);
  const { data, loading, error, fetchMedia, reset } = useFetchMedia();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.url) {
      setUrl(location.state.url);
      handleFetch(location.state.url);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [location.state]);

  const handleFetch = async (inputUrl) => {
    const targetUrl = inputUrl || url;
    if (!targetUrl.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    if (!isValidInstagramURL(targetUrl)) {
      toast.error('Please enter a valid Instagram URL');
      return;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    await fetchMedia(fetchInstagramAudio, targetUrl);
  };

  const togglePlay = () => {
    if (!data) return;

    if (isPlaying) {
      clearInterval(progressInterval.current);
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      progressInterval.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          if (next >= data.duration) {
            clearInterval(progressInterval.current);
            setIsPlaying(false);
            setProgress(100);
            return data.duration;
          }
          setProgress((next / data.duration) * 100);
          return next;
        });
      }, 100);
    }
  };

  const handleSeek = (e) => {
    if (!data) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = position * data.duration;
    setCurrentTime(newTime);
    setProgress(position * 100);
  };

  // Waveform bars
  const waveformBars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    height: Math.random() * 100,
    delay: i * 0.02,
  }));

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
            onChange={setUrl}
            onSubmit={handleFetch}
            loading={loading}
            placeholder="Paste Instagram Reel/Video URL here..."
            id="instagram-audio-url-input"
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
        {loading && <SkeletonLoader type="audio" />}

        {/* Audio Player */}
        <AnimatePresence>
          {data && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Player card */}
              <div className="glass rounded-2xl p-6 sm:p-8">
                {/* Cover & info */}
                <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                  <motion.div
                    className="relative w-28 h-28 rounded-2xl overflow-hidden flex-shrink-0 shadow-2xl"
                    animate={isPlaying ? { rotate: [0, 360] } : { rotate: 0 }}
                    transition={isPlaying ? { duration: 8, repeat: Infinity, ease: 'linear' } : { duration: 0.5 }}
                  >
                    <img
                      src={data.coverArt}
                      alt={data.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    {/* Center dot */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-bg-dark rounded-full border-2 border-white/30" />
                    </div>
                  </motion.div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-white font-bold text-lg mb-1">{data.title}</h3>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      {data.artistAvatar && (
                        <img
                          src={data.artistAvatar}
                          alt={data.artist}
                          className="w-5 h-5 rounded-full"
                        />
                      )}
                      <p className="text-text-muted text-sm">@{data.artist}</p>
                    </div>
                    <p className="text-text-muted text-xs mt-1">
                      🎵 Used in {data.usageCount}
                    </p>
                  </div>
                </div>

                {/* Waveform visualization */}
                <div className="flex items-end justify-center gap-[2px] h-16 mb-4 px-2">
                  {waveformBars.map((bar) => (
                    <motion.div
                      key={bar.id}
                      className={`w-1 rounded-full ${
                        (bar.id / waveformBars.length) * 100 <= progress
                          ? 'bg-primary'
                          : 'bg-bg-surface-light'
                      }`}
                      style={{
                        height: `${20 + bar.height * 0.6}%`,
                      }}
                      animate={
                        isPlaying
                          ? {
                              height: [`${20 + bar.height * 0.6}%`, `${20 + Math.random() * 60}%`, `${20 + bar.height * 0.6}%`],
                            }
                          : {}
                      }
                      transition={
                        isPlaying
                          ? {
                              duration: 0.5 + Math.random() * 0.5,
                              repeat: Infinity,
                              delay: bar.delay,
                            }
                          : {}
                      }
                    />
                  ))}
                </div>

                {/* Progress bar */}
                <div
                  className="w-full h-1.5 bg-bg-surface-light rounded-full cursor-pointer mb-3 group"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary rounded-full relative transition-all"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Time */}
                <div className="flex justify-between text-text-muted text-xs mb-6">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(data.duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button className="p-2 text-text-muted hover:text-white transition-colors cursor-pointer">
                    <SkipBack size={20} />
                  </button>
                  <motion.button
                    onClick={togglePlay}
                    className="w-14 h-14 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                  </motion.button>
                  <button className="p-2 text-text-muted hover:text-white transition-colors cursor-pointer">
                    <SkipForward size={20} />
                  </button>
                  <button className="p-2 text-text-muted hover:text-white transition-colors cursor-pointer">
                    <Volume2 size={20} />
                  </button>
                </div>
              </div>

              {/* Download Options */}
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
