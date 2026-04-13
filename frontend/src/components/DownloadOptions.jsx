import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, FileVideo, FileAudio, FileImage, FileArchive, Loader2 } from 'lucide-react';
import { formatFileSize } from '../utils/helpers';

const DownloadOptions = ({ formats = [], url = '', onDownload, downloadState = {} }) => {
  const { activeFormat, status } = downloadState;
  const isAnyDownloading = status === 'queued' || status === 'processing';

  const [loadingText, setLoadingText] = useState("Processing...");

  useEffect(() => {
    if (!isAnyDownloading) {
      setLoadingText("Processing...");
      return;
    }

    const timer1 = setTimeout(() => setLoadingText("High traffic detected. Please wait, you are in the queue..."), 5000);
    const timer2 = setTimeout(() => setLoadingText("Your video is large or our servers are very busy. Hang tight..."), 15000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isAnyDownloading]);

  if (!formats || formats.length === 0) return null;

  const handleDownload = (format) => {
    if (onDownload) {
      onDownload(url, format);
    }
  };

  const getIcon = (format) => {
    if (format.format === 'mp3' || format.type === 'audio') return FileAudio;
    if (format.format === 'jpg' || format.format === 'png' || format.format === 'webp') return FileImage;
    if (format.format === 'zip') return FileArchive;
    return FileVideo;
  };

  const getQualityColor = (quality) => {
    if (!quality) return 'text-text-secondary';
    if (quality.includes('1080')) return 'text-secondary';
    if (quality.includes('720')) return 'text-accent';
    if (quality.includes('320')) return 'text-secondary';
    return 'text-text-secondary';
  };

  const isFormatActive = (format) => {
    const key = format.quality || format.formatId;
    return activeFormat === key && isAnyDownloading;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="w-full"
    >
      <h4 className="text-text-primary font-semibold text-lg mb-4 flex items-center gap-2">
        <Download size={20} className="text-primary" />
        Download Options
      </h4>

      {/* Download error */}
      {downloadState.error && (
        <div className="mb-4 p-3 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {downloadState.error}
        </div>
      )}

      {/* Progress bar and Message when downloading */}
      {isAnyDownloading && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span className="animate-pulse">{loadingText}</span>
            <span>{Math.round(downloadState.progress || 0)}%</span>
          </div>
          <div className="w-full h-2 bg-bg-surface-lighter rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${downloadState.progress || 0}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {formats.map((format, index) => {
          const Icon = getIcon(format);
          const isDownloading = isFormatActive(format);
          const isDisabled = isAnyDownloading && !isDownloading;

          return (
            <motion.button
              key={`${format.quality || format.formatId}-${format.format}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
              onClick={() => handleDownload(format)}
              disabled={isDownloading || isDisabled}
              className={`flex items-center justify-between p-4 glass rounded-xl transition-all duration-300 group cursor-pointer
                ${isDownloading ? 'ring-2 ring-primary/40 bg-primary/5' : ''}
                ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-primary/5 hover:shadow-md'}
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm
                  ${isDownloading ? 'bg-primary text-white' : 'bg-white text-primary group-hover:bg-primary group-hover:text-white'}`}
                >
                  <Icon size={20} className={isDownloading ? 'text-white' : 'text-primary group-hover:text-white'} />
                </div>
                <div className="text-left">
                  <p className={`font-semibold ${getQualityColor(format.quality)}`}>
                    {format.label || format.quality}
                  </p>
                  <p className="text-text-muted text-sm">
                    {(format.format || 'mp4').toUpperCase()}
                    {format.size ? ` • ${formatFileSize(format.size)}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDownloading ? (
                  <div className="flex items-center gap-2 text-secondary">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm hidden sm:inline font-medium">Processing...</span>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all duration-300">
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
