import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Download,
  Zap,
  Shield,
  Smartphone,
  Sparkles,
  ArrowRight,
  Video,
  Scissors,
  Film,
  Image,
  Music,
  Clock,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { YoutubeIcon as Youtube, InstagramIcon as Instagram } from '../components/BrandIcons';
import URLInput from '../components/URLInput';
import IframeAdBanner from '../components/IframeAdBanner';
import HowToDownload from '../components/HowToDownload';
import SEOHead from '../components/SEOHead';
import SEOFaq from '../components/SEOFaq';
import usePopunder from '../hooks/usePopunder';
import { detectPlatform } from '../utils/helpers';

const features = [
  {
    icon: Zap,
    title: 'Fast download',
    description: 'Process and fetch your media links instantly in seconds.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Download,
    title: 'HD quality',
    description: 'Get the highest resolution possible, up to 1080p and 4K.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Smartphone,
    title: 'No watermark',
    description: 'All downloads are clean, original, and free from watermarks.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Shield,
    title: 'Free & secure',
    description: 'No hidden fees, no tracking, and fully secure connections.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

const platforms = [
  {
    name: 'YouTube Video',
    icon: Video,
    path: '/youtube/video',
    color: 'text-youtube',
    bg: 'bg-youtube/10',
    borderColor: 'hover:border-youtube/30',
    description: 'Download any YouTube video in HD quality',
  },
  {
    name: 'YouTube Shorts',
    icon: Scissors,
    path: '/youtube/shorts',
    color: 'text-youtube',
    bg: 'bg-youtube/10',
    borderColor: 'hover:border-youtube/30',
    description: 'Save vertical YouTube Shorts easily',
  },
  {
    name: 'Instagram Reels',
    icon: Film,
    path: '/instagram/reels',
    color: 'text-instagram',
    bg: 'bg-instagram/10',
    borderColor: 'hover:border-instagram/30',
    description: 'Download Instagram Reels in full quality',
  },
  {
    name: 'Instagram Posts',
    icon: Image,
    path: '/instagram/post',
    color: 'text-instagram',
    bg: 'bg-instagram/10',
    borderColor: 'hover:border-instagram/30',
    description: 'Save photos and carousels from posts',
  },
  {
    name: 'Instagram Audio',
    icon: Music,
    path: '/instagram/audio',
    color: 'text-instagram',
    bg: 'bg-instagram/10',
    borderColor: 'hover:border-instagram/30',
    description: 'Extract audio from Instagram content',
  },
  {
    name: 'Instagram Story',
    icon: Smartphone,
    path: '/instagram/reels', // Stories use same pipeline
    color: 'text-instagram',
    bg: 'bg-instagram/10',
    borderColor: 'hover:border-instagram/30',
    description: 'Download 24h Instagram Stories',
  },
];

const stats = [
  { label: 'Downloads', value: '2M+', icon: Download },
  { label: 'Active Users', value: '150K+', icon: TrendingUp },
  { label: 'Avg Speed', value: '<3s', icon: Clock },
];

const LandingPage = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  const triggerPopunder = usePopunder();

  const handleSubmit = (inputUrl) => {
    // Trigger popunder on first real user action
    triggerPopunder();

    const platform = detectPlatform(inputUrl);
    if (platform === 'youtube-shorts') {
      navigate('/youtube/shorts', { state: { url: inputUrl } });
    } else if (platform === 'youtube') {
      navigate('/youtube/video', { state: { url: inputUrl } });
    } else if (platform === 'instagram-reels') {
      navigate('/instagram/reels', { state: { url: inputUrl } });
    } else if (platform === 'instagram-post') {
      navigate('/instagram/post', { state: { url: inputUrl } });
    } else if (platform?.includes('instagram')) {
      navigate('/instagram/reels', { state: { url: inputUrl } });
    } else {
      navigate('/youtube/video', { state: { url: inputUrl } });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="relative overflow-hidden">
      <SEOHead
        title="Free Instagram Video & Reels Downloader"
        description="Download Instagram videos, reels, photos, and audio for free in HD quality. No watermark, no signup required. Fast and safe online downloader."
      />
      {/* Background effects */}
      <div className="absolute inset-0 animated-gradient opacity-80" />

      {/* Decorative blobs */}
      <div className="blob-pink top-[-100px] right-[-100px]" />
      <div className="blob-blue bottom-[-100px] left-[-100px]" />
      <div className="blob-violet top-[40%] left-[30%]" />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm font-medium text-text-secondary border border-primary/20">
              <Sparkles size={16} className="text-secondary" />
              Free & Fast Media Downloader
              <ArrowRight size={14} className="text-primary" />
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-text-primary"
          >
            Download <span className="gradient-text-alt">Instagram Reels</span> in HD Free
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Download your favorite Instagram Reels, Photos, and Videos in high quality. Fast, free, and no watermark.
          </motion.p>

          {/* URL Input */}
          <motion.div variants={itemVariants} className="mb-6">
            <URLInput
              value={url}
              onChange={setUrl}
              onSubmit={handleSubmit}
              placeholder="Paste YouTube or Instagram URL here..."
              id="hero-url-input"
            />
          </motion.div>

          {/* Inline ad after input */}
          <motion.div variants={itemVariants} className="mb-10 w-full flex justify-center">
            <IframeAdBanner id="ad-landing-hero-inline" />
          </motion.div>

        </motion.div>
      </section>

      {/* Clean Iframe Ad — between hero and platforms */}
      <section className="relative py-4 px-4 sm:px-6 z-10">
        <div className="max-w-4xl mx-auto flex justify-center">
          <IframeAdBanner id="ad-landing-mid" />
        </div>
      </section>

      {/* Platform Cards */}
      <section className="relative py-16 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              Select a <span className="gradient-text">Downloader Tool</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform, index) => (
              <React.Fragment key={platform.name}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={platform.path}
                    className={`group flex items-start gap-4 p-5 bg-white rounded-2xl border border-primary/10 ${platform.borderColor} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
                  >
                    <div className={`w-12 h-12 ${platform.bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <platform.icon size={22} className={platform.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-text-primary font-bold mb-1 flex items-center gap-2">
                        {platform.name}
                        <ChevronRight size={14} className="text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h3>
                      <p className="text-text-secondary text-sm">{platform.description}</p>
                    </div>
                  </Link>
                </motion.div>

                {/* Inline ad after every 3rd card */}
                {(index + 1) % 3 === 0 && index < platforms.length - 1 && (
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-center" id="ad-inline">
                    <IframeAdBanner id={`ad-inline-${index}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-16 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Why Use Our <span className="gradient-text-alt">Downloader</span>?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto font-medium">
              Built with performance, security, and ease of use in mind.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-primary/5 hover:border-primary/20 hover:shadow-xl transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <feature.icon size={24} className={feature.color} />
                </div>
                <h3 className="text-text-primary font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Download */}
      <section className="relative py-16 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <HowToDownload platform="Instagram & Media" />
        </div>
      </section>

      {/* SEO FAQ */}
      <section className="relative py-16 px-4 sm:px-6 z-10 pb-24 bg-slate-50/50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto">
          <SEOFaq platform="Free Downloader" />
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
