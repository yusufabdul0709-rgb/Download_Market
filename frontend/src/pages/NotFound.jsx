import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <div className="blob-pink top-[-100px] right-[-100px]" />
      <div className="blob-violet bottom-[-100px] left-[-100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center px-4 max-w-lg mx-auto"
      >
        <div className="text-8xl sm:text-9xl font-black gradient-text mb-4">404</div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-3">
          Page Not Found
        </h1>
        <p className="text-text-secondary font-medium mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back to downloading!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Home size={18} />
            Go Home
          </Link>
          <Link
            to="/youtube/video"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-2xl border border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-300"
          >
            <Search size={18} />
            Try Downloader
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
