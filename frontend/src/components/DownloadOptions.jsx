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
      className="w-full flex flex-col items-center"
    >
      {/* Download error */}
      {downloadState.error && (
        <div className="w-full mb-4 p-3 rounded-xl bg-danger/10 text-danger text-sm text-center">
          {downloadState.error}
        </div>
      )}

      {/* Progress bar and Message when downloading */}
      {isAnyDownloading && (
        <div className="w-full mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1.5 font-medium">
            <span className="animate-pulse">{loadingText}</span>
            <span>{Math.round(downloadState.progress || 0)}%</span>
          </div>
          <div className="h-2 bg-black/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(downloadState.progress || 0)}%` }}
              className="h-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]"
            />
          </div>
        </div>
      )}

      {/* ── Massive Primary Button (Best Format) ── */}
      <button
        onClick={() => handleDownload(formats[0])}
        disabled={isAnyDownloading}
        className="w-full relative shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 rounded-xl overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] group-hover:scale-[1.02] transition-transform duration-300" />
        <div className="relative px-6 py-4 sm:py-5 flex items-center justify-center gap-3">
          {isFormatActive(formats[0]) ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <Download size={24} className="text-white" />
          )}
          <span className="text-white font-bold text-lg sm:text-xl tracking-wide">
            {isFormatActive(formats[0]) ? 'Downloading...' : 'Download'}
          </span>
        </div>
      </button>

      {/* ── Secondary Quality Options (If any) ── */}
      {formats.length > 1 && (
        <div className="w-full mt-4 flex flex-wrap justify-center gap-2">
          {formats.slice(1).map((format, idx) => {
            const Icon = getIcon(format);
            const isActive = isFormatActive(format);
            const isDownloadingThis = isActive && isAnyDownloading;
            
            return (
              <button
                key={idx}
                onClick={() => handleDownload(format)}
                disabled={isAnyDownloading}
                className={`py-2 px-4 rounded-lg font-medium text-sm border transition-all duration-300 flex items-center gap-2 ${
                  isDownloadingThis 
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-600' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm'
                } ${isAnyDownloading && !isDownloadingThis ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isDownloadingThis ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                {format.label || format.quality || format.formatId}
                {format.size && <span className="opacity-60 hidden sm:inline ml-1">• {formatFileSize(format.size)}</span>}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default DownloadOptions;
