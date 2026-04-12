import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Clipboard, Sparkles, X } from 'lucide-react';
import { YoutubeIcon as Youtube, InstagramIcon as Instagram } from './BrandIcons';
import { detectPlatform } from '../utils/helpers';

const URLInput = ({
  value,
  onChange,
  onSubmit,
  loading = false,
  placeholder = 'Paste your URL here...',
  id = 'url-input',
}) => {
  const [platform, setPlatform] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const detected = detectPlatform(value);
    setPlatform(detected);
  }, [value]);

  // Paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onChange(text);
      }
    } catch {
      // Clipboard not available
    }
  }, [onChange]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && onSubmit) {
      onSubmit(value.trim());
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const PlatformIcon = () => {
    if (!platform) return <Link2 size={20} className="text-text-muted" />;
    if (platform.includes('youtube'))
      return <Youtube size={20} className="text-youtube" />;
    if (platform.includes('instagram'))
      return <Instagram size={20} className="text-instagram" />;
    return <Link2 size={20} className="text-primary" />;
  };

  const platformLabel = platform
    ? platform.replace('-', ' ').replace(/^\w/, (c) => c.toUpperCase())
    : null;

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div
        className={`relative flex items-center gap-3 rounded-2xl p-1.5 transition-all duration-300 ${
          isFocused
            ? 'glass-strong ring-2 ring-primary/50 shadow-lg shadow-primary/10'
            : 'glass hover:ring-1 hover:ring-primary/30'
        }`}
      >
        {/* Platform icon */}
        <div className="pl-4 flex-shrink-0">
          <PlatformIcon />
        </div>

        {/* Input */}
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 bg-transparent text-white placeholder:text-text-muted py-3 px-2 text-base outline-none min-w-0"
          autoComplete="off"
        />

        {/* Platform badge */}
        <AnimatePresence>
          {platformLabel && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`hidden sm:flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold ${
                platform?.includes('youtube')
                  ? 'bg-youtube/20 text-youtube'
                  : 'bg-instagram/20 text-instagram'
              }`}
            >
              <Sparkles size={12} />
              {platformLabel}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-text-muted hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}

        {/* Paste button */}
        <button
          type="button"
          onClick={handlePaste}
          className="flex items-center gap-1 px-3 py-2 text-sm text-text-secondary hover:text-white transition-colors cursor-pointer"
          title="Paste from clipboard"
        >
          <Clipboard size={16} />
          <span className="hidden sm:inline">Paste</span>
        </button>

        {/* Submit button */}
        <motion.button
          type="submit"
          disabled={!value.trim() || loading}
          className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          whileHover={value.trim() ? { scale: 1.02 } : {}}
          whileTap={value.trim() ? { scale: 0.98 } : {}}
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <Sparkles size={18} />
          )}
          <span className="hidden sm:inline">{loading ? 'Fetching...' : 'Fetch'}</span>
        </motion.button>
      </div>
    </form>
  );
};

export default URLInput;
