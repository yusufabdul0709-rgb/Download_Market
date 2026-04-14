import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Menu,
  X,
  ChevronDown,
  Video,
  Image,
  Music,
  Film,
} from 'lucide-react';
import { InstagramIcon as Instagram, FacebookIcon as Facebook } from './BrandIcons';

const navLinks = [
  {
    label: 'Home',
    path: '/',
  },
  {
    label: 'Facebook',
    icon: Facebook,
    children: [
      { label: 'Reels', path: '/facebook/reels', icon: Film },
      { label: 'Post', path: '/facebook/post', icon: Image },
      { label: 'Audio', path: '/facebook/audio', icon: Music },
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

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'glass-strong shadow-lg'
          : 'bg-white/60 backdrop-blur-md'
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
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
              <Download size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-text-primary">
              Download<span className="gradient-text">Market</span>
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
                        ? 'text-primary bg-primary/8'
                        : 'text-text-secondary hover:text-primary hover:bg-primary/5'
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
                        className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl overflow-hidden shadow-xl shadow-primary/8 border border-primary/8 py-1"
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                              location.pathname === child.path
                                ? 'text-primary bg-primary/8 font-medium'
                                : 'text-text-secondary hover:text-primary hover:bg-primary/5'
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
                      ? 'text-primary bg-primary/8'
                      : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer"
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
            className="lg:hidden bg-white border-t border-primary/8 overflow-hidden shadow-lg"
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
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-text-secondary hover:text-primary rounded-xl hover:bg-primary/5 transition-all cursor-pointer"
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
                                  ? 'text-primary bg-primary/8 font-medium'
                                  : 'text-text-muted hover:text-primary hover:bg-primary/5'
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
                        ? 'text-primary bg-primary/8'
                        : 'text-text-secondary hover:text-primary hover:bg-primary/5'
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
