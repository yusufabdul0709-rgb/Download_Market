import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Moon,
  Sun,
  Menu,
  X,
  ChevronDown,
  Video,
  Scissors,
  Image,
  Music,
  Film,
} from 'lucide-react';
import { YoutubeIcon as Youtube, InstagramIcon as Instagram } from './BrandIcons';

const navLinks = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'YouTube',
    icon: Youtube,
    children: [
      { label: 'Video', path: '/youtube/video', icon: Video },
      { label: 'Shorts', path: '/youtube/shorts', icon: Scissors },
    ],
  },
  {
    label: 'Instagram',
    icon: Instagram,
    children: [
      { label: 'Reels', path: '/instagram/reels', icon: Film },
      { label: 'Post', path: '/instagram/post', icon: Image },
      { label: 'Audio', path: '/instagram/audio', icon: Music },
    ],
  },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
  }, [location]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass-strong shadow-2xl shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            id="navbar-logo"
          >
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
              <Download size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Download<span className="text-primary">Market</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.children ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(link.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer ${
                      location.pathname.includes(link.label.toLowerCase())
                        ? 'text-white bg-bg-surface-light'
                        : 'text-text-secondary hover:text-white hover:bg-bg-surface-light/50'
                    }`}
                  >
                    {link.icon && <link.icon size={16} />}
                    {link.label}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        openDropdown === link.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openDropdown === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-1 w-48 glass-strong rounded-xl overflow-hidden shadow-2xl shadow-black/30 py-1"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                              location.pathname === child.path
                                ? 'text-primary bg-primary/10'
                                : 'text-text-secondary hover:text-white hover:bg-bg-surface-light/50'
                            }`}
                          >
                            <child.icon size={16} />
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    location.pathname === link.path
                      ? 'text-white bg-bg-surface-light'
                      : 'text-text-secondary hover:text-white hover:bg-bg-surface-light/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-bg-surface-light/50 transition-all cursor-pointer"
              id="dark-mode-toggle"
              title="Toggle dark mode"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl text-text-secondary hover:text-white hover:bg-bg-surface-light/50 transition-all cursor-pointer"
              id="mobile-menu-toggle"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-strong border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label}>
                    <button
                      onClick={() =>
                        setOpenDropdown(
                          openDropdown === link.label ? null : link.label
                        )
                      }
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-text-secondary hover:text-white rounded-xl hover:bg-bg-surface-light/50 transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        {link.icon && <link.icon size={16} />}
                        {link.label}
                      </span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          openDropdown === link.label ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <AnimatePresence>
                      {openDropdown === link.label && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="pl-6 space-y-1 overflow-hidden"
                        >
                          {link.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-2 px-4 py-2.5 text-sm rounded-xl transition-colors ${
                                location.pathname === child.path
                                  ? 'text-primary bg-primary/10'
                                  : 'text-text-muted hover:text-white hover:bg-bg-surface-light/50'
                              }`}
                            >
                              <child.icon size={15} />
                              {child.label}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`block px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                      location.pathname === link.path
                        ? 'text-white bg-bg-surface-light'
                        : 'text-text-secondary hover:text-white hover:bg-bg-surface-light/50'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
