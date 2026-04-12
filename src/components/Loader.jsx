import { motion } from 'framer-motion';

const Loader = ({ text = 'Loading...', size = 'md' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center gap-4 py-12"
    >
      {/* Animated loader */}
      <div className="relative">
        <div className={`${sizes[size]} rounded-full border-4 border-bg-surface-light animate-spin border-t-primary`} />
        <div className={`absolute inset-0 ${sizes[size]} rounded-full border-4 border-transparent animate-spin border-b-secondary`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
      </div>
      <p className="text-text-muted text-sm font-medium animate-pulse">{text}</p>
    </motion.div>
  );
};

export default Loader;
