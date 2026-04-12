import { motion } from 'framer-motion';
import { Download, FileVideo, FileAudio, Check } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';
import { useState } from 'react';
import toast from 'react-hot-toast';

const DownloadOptions = ({ formats = [] }) => {
  const [downloading, setDownloading] = useState(null);

  if (!formats || formats.length === 0) return null;

  const handleDownload = async (format) => {
    setDownloading(format.quality);
    // Simulate download delay
    await new Promise((r) => setTimeout(r, 2000));
    setDownloading(null);
    toast.success(`Download started: ${format.label}`);
  };

  const getIcon = (format) => {
    if (format.format === 'mp3') return FileAudio;
    return FileVideo;
  };

  const getQualityColor = (quality) => {
    if (quality === '1080p') return 'text-secondary';
    if (quality === '720p') return 'text-primary-light';
    if (quality === '320kbps') return 'text-secondary';
    return 'text-text-secondary';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full"
    >
      <h4 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
        <Download size={20} className="text-primary" />
        Download Options
      </h4>
      <div className="grid gap-3">
        {formats.map((format, index) => {
          const Icon = getIcon(format);
          const isDownloading = downloading === format.quality;
          return (
            <motion.button
              key={format.quality + format.format}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleDownload(format)}
              disabled={isDownloading}
              className="flex items-center justify-between p-4 glass rounded-xl hover:bg-bg-surface-light/50 transition-all duration-300 group cursor-pointer disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon size={20} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${getQualityColor(format.quality)}`}>
                    {format.label}
                  </p>
                  <p className="text-text-muted text-sm">
                    {format.format.toUpperCase()} • {formatFileSize(format.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDownloading ? (
                  <div className="flex items-center gap-2 text-secondary">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="text-sm">Downloading...</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300">
                    <Download size={18} className="text-primary group-hover:text-white" />
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DownloadOptions;
