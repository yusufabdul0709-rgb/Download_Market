import { useState } from 'react';
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
import AdBanner from '../components/AdBanner';
import { detectPlatform } from '../utils/helpers';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Download videos in seconds with our optimized processing pipeline.',
    color: 'text-warning',
    bg: 'bg-warning/10',
  },
  {
    icon: Shield,
    title: 'Safe & Private',
    description: 'No tracking, no ads, no history stored. Your privacy comes first.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: Smartphone,
    title: 'All Devices',
    description: 'Works seamlessly on desktop, tablet, and mobile devices.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Download,
    title: 'Multiple Formats',
    description: 'Choose from various quality options — 360p to 1080p, plus MP3.',
    color: 'text-primary',
    bg: 'bg-primary/10',
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
];

const stats = [
  { label: 'Downloads', value: '2M+', icon: Download },
  { label: 'Active Users', value: '150K+', icon: TrendingUp },
  { label: 'Avg Speed', value: '<3s', icon: Clock },
];

const LandingPage = () => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (inputUrl) => {
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
      // Default to YouTube video
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
            Download From{' '}
            <span className="gradient-text">YouTube</span>
            {' & '}
            <span className="gradient-text-alt">Instagram</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
          >
            Paste a URL, choose your quality, and download instantly.
            Videos, Shorts, Reels, Posts, and Audio — all in one place.
          </motion.p>

          {/* URL Input */}
          <motion.div variants={itemVariants} className="mb-8">
            <URLInput
              value={url}
              onChange={setUrl}
              onSubmit={handleSubmit}
              placeholder="Paste YouTube or Instagram URL here..."
              id="hero-url-input"
            />
          </motion.div>

          {/* Adsterra Native Banner */}
          <AdBanner />

          {/* CTA buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 mb-12"
          >
            <Link
              to="/youtube/video"
              className="flex items-center gap-2 px-6 py-3 bg-white text-youtube border border-youtube/20 rounded-2xl font-semibold text-sm hover:bg-youtube/5 hover:border-youtube/40 hover:shadow-md transition-all duration-300"
              id="cta-youtube"
            >
              <Youtube size={18} />
              YouTube Downloader
            </Link>
            <Link
              to="/instagram/reels"
              className="flex items-center gap-2 px-6 py-3 bg-white text-instagram border border-instagram/20 rounded-2xl font-semibold text-sm hover:bg-instagram/5 hover:border-instagram/40 hover:shadow-md transition-all duration-300"
              id="cta-instagram"
            >
              <Instagram size={18} />
              Instagram Downloader
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-center gap-8 sm:gap-12"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-text-secondary text-sm mt-1 font-medium">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Platform Cards */}
      <section className="relative py-20 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              All Your <span className="gradient-text">Downloads</span> in One Place
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto font-medium">
              Choose a platform and start downloading your favorite content instantly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform, index) => (
              <motion.div
                key={platform.name}
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
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4 sm:px-6 z-10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Why Choose <span className="gradient-text-alt">Download Market</span>?
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

      {/* Bottom CTA */}
      <section className="relative py-20 px-4 sm:px-6 z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-8 sm:p-12 shadow-2xl shadow-primary/10"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Ready to Download?
            </h2>
            <p className="text-text-secondary mb-8 max-w-lg mx-auto font-medium">
              Start downloading your favorite videos and media content now. It's free, fast, and always will be.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/youtube/video"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-accent hover:from-primary-dark hover:to-accent-dark text-white font-bold rounded-2xl transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1"
              >
                <Download size={20} />
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
