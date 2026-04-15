import { Link } from 'react-router-dom';
import { Download, Heart } from 'lucide-react';
import { YoutubeIcon as Youtube, InstagramIcon as Instagram, FacebookIcon as Facebook } from './BrandIcons';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-primary/8 bg-white/60 backdrop-blur-sm">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Download size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-text-primary">
                Download<span className="gradient-text">Market</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              The fastest and most reliable way to download your favorite videos and media from YouTube, Facebook & Instagram.
            </p>
          </div>

          {/* YouTube Links */}
          <div>
            <h4 className="flex items-center gap-2 text-text-primary font-semibold mb-4">
              <Youtube size={18} className="text-youtube" />
              YouTube
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/youtube/video" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Video Downloader
                </Link>
              </li>
              <li>
                <Link to="/youtube/shorts" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Shorts Downloader
                </Link>
              </li>
            </ul>
          </div>

          {/* Facebook Links */}
          <div>
            <h4 className="flex items-center gap-2 text-text-primary font-semibold mb-4">
              <Facebook size={18} className="text-blue-600" />
              Facebook
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/facebook/reels" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Reels Downloader
                </Link>
              </li>
              <li>
                <Link to="/facebook/post" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Post Downloader
                </Link>
              </li>
              <li>
                <Link to="/facebook/audio" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Audio Extractor
                </Link>
              </li>
            </ul>
          </div>

          {/* Instagram Links */}
          <div>
            <h4 className="flex items-center gap-2 text-text-primary font-semibold mb-4">
              <Instagram size={18} className="text-instagram" />
              Instagram
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/instagram/reels" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Reels Downloader
                </Link>
              </li>
              <li>
                <Link to="/instagram/post" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Post Downloader
                </Link>
              </li>
              <li>
                <Link to="/instagram/audio" className="text-text-muted text-sm hover:text-primary transition-colors">
                  Audio Extractor
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-primary/8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © {currentYear} DownloadMarket. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/privacy-policy" className="text-text-muted hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-text-muted hover:text-primary transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="text-text-muted hover:text-primary transition-colors">
              Contact
            </Link>
          </div>
          <p className="text-text-muted text-sm flex items-center gap-1">
            Made with <Heart size={14} className="text-secondary fill-secondary" /> for the internet
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
