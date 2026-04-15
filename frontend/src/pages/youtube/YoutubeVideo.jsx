import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Video, Clock } from 'lucide-react';
import URLInput from '../../components/URLInput';
import IframeAdBanner from '../../components/IframeAdBanner';
import PreviewCard from '../../components/PreviewCard';
import ErrorMessage from '../../components/ErrorMessage';
import SkeletonLoader from '../../components/SkeletonLoader';
import HowToDownload from '../../components/HowToDownload';
import ToolFeatures from '../../components/ToolFeatures';
import SEOHead from '../../components/SEOHead';
import SEOFaq from '../../components/SEOFaq';
import usePopunder from '../../hooks/usePopunder';
import { startDownload, triggerBrowserDownload } from '../../services/mediaService';
import toast from 'react-hot-toast';

const YoutubeVideo = () => {
  const [url, setUrl] = useState('');
  const location = useLocation();
  const triggerPopunder = usePopunder();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mediaData, setMediaData] = useState(null);

  useEffect(() => {
    if (location.state?.url) {
      setUrl(location.state.url);
      fetchMediaData(location.state.url);
    }
  }, [location.state]);

  const handleFetch = (inputUrl) => {
    fetchMediaData(inputUrl);
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);
    if (!newUrl.trim()) resetState();
  };

  const resetState = () => {
    setLoading(false);
    setError(null);
    setMediaData(null);
  };

  const fetchMediaData = async (targetUrl) => {
    if (!targetUrl?.trim()) {
      toast.error('Please enter a URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMediaData(null);
    
    try {
      const data = await startDownload({ url: targetUrl.trim(), platform: 'youtube' });
      if (data && data.success) {
        setMediaData(data);
        toast.success(`Media info loaded via ${data.provider_used || 'Fallback API'}`);
      } else {
        throw new Error('Failed to retrieve extraction link');
      }
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Failed to fetch media.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadLink = (downloadUrl) => {
    const adFired = triggerPopunder();
    if (adFired) {
      setTimeout(() => triggerBrowserDownload(downloadUrl, 'video.mp4'), 2000);
    } else {
      triggerBrowserDownload(downloadUrl, 'video.mp4');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="blob-pink top-[-100px] left-[-100px]" />
      <div className="blob-blue bottom-[-100px] right-[-100px]" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16 z-10">

        <SEOHead
          title="YouTube Video Downloader - Save YouTube Videos in HD Free"
          description="Download YouTube videos in HD quality for free. Fast, secure, and no login required. Download Market helps you save YouTube content to your device."
        />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 border border-red-200 rounded-full text-red-600 text-sm font-medium mb-4 shadow-sm">
            <Video size={18} />
            YouTube Downloader
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
            Download <span className="text-red-600 font-extrabold">YouTube Videos</span> in HD
          </h1>
          <p className="text-text-secondary font-medium max-w-lg mx-auto">
            Extract high-quality direct download links for your favorite videos & shorts instantly.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
          <URLInput
            value={url}
            onChange={handleUrlChange}
            onSubmit={handleFetch}
            loading={loading}
            placeholder="Paste YouTube Video URL here..."
            id="youtube-url-input"
            buttonColor="bg-red-500 hover:bg-red-600"
          />
        </motion.div>

        <div className="mb-8" id="ad-inline">
          <IframeAdBanner id="ad-yt-inline" />
        </div>

        <AnimatePresence>
          {error && (
            <div className="mb-6">
              <ErrorMessage message={error} onRetry={() => handleFetch(url)} onDismiss={resetState} />
            </div>
          )}
        </AnimatePresence>

        {loading && (
          <div className="max-w-md mx-auto w-full space-y-4">
            <SkeletonLoader type="vertical-card" statusMessage="Fethcing API Extractors..." />
          </div>
        )}

        <AnimatePresence>
          {mediaData && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div id="ad-before-download" className="mb-2">
                <IframeAdBanner id="ad-yt-pre-result" />
              </div>

              <div className="max-w-sm mx-auto bg-white rounded-2xl shadow-xl shadow-red-500/10 border border-slate-100 overflow-hidden flex flex-col transform transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-red-500/20">
                {/* Fallback mock preview object for PreviewCard compatibility */}
				<PreviewCard 
                  data={{
                    title: mediaData.title,
                    thumbnail: mediaData.thumbnail_url,
                    duration: mediaData.duration,
                    platform: 'youtube',
                    type: mediaData.source === 'youtube-shorts' ? 'shorts' : 'video'
                  }} 
                  isVertical={mediaData.source === 'youtube-shorts'} 
                />
                
                <div className="p-4 sm:p-5 mt-1 space-y-2">
                   {mediaData.download_links && mediaData.download_links.length > 0 ? (
                      mediaData.download_links.map((link, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleDownloadLink(link.url)}
                          className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 ${
                            link.quality.includes('1080') || link.quality === 'HD'
                              ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                          }`}
                        >
                          <Video size={18} />
                          Download {link.quality} {link.type === 'audio' ? 'Audio' : ''}
                        </button>
                      ))
                   ) : (
                     <p className="text-sm text-center text-red-500 font-medium">No valid download links found.</p>
                   )}
                </div>
                
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100/60">
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug mb-3">
                    {mediaData.title || "Extracted Video"}
                  </h3>
                   <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="px-2 py-1 bg-red-100 text-red-600 rounded-md">
                        {mediaData.provider_used}
                      </span>
                      {mediaData.served_from_cache && (
                         <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-md">
                           Cached
                         </span>
                      )}
                   </div>
                </div>
              </div>

              <div id="ad-after-download" className="mt-4">
                <IframeAdBanner id="ad-yt-bottom" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <HowToDownload platform="YouTube Video" />
        <ToolFeatures platform="YouTube Video Downloader" />
        <SEOFaq platform="YouTube Video" />
      </div>
    </div>
  );
};

export default YoutubeVideo;
