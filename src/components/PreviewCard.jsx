import { motion } from 'framer-motion';
import { Play, Clock, Eye, User } from 'lucide-react';
import { formatDuration, truncateText } from '../utils/helpers';

const PreviewCard = ({ data, isVertical = false }) => {
  if (!data) return null;

  const {
    title,
    caption,
    thumbnail,
    coverArt,
    duration,
    views,
    viewCount,
    channel,
    username,
    uploader,
  } = data;

  const displayTitle = title || caption || 'Untitled';
  const displayImage = thumbnail || coverArt;
  const displayUser = channel || username || uploader;

  // Format view count
  const displayViews = views || (viewCount ? `${(viewCount / 1000000).toFixed(1)}M views` : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass rounded-2xl overflow-hidden ${
        isVertical ? 'max-w-sm mx-auto' : 'w-full'
      }`}
    >
      {/* Thumbnail */}
      {displayImage && (
        <div
          className={`relative overflow-hidden bg-bg-surface-light ${
            isVertical ? 'aspect-[9/16]' : 'aspect-video'
          }`}
        >
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <Play size={28} className="text-primary ml-1" fill="currentColor" />
            </div>
          </div>
          {/* Duration badge */}
          {duration > 0 && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
              <Clock size={12} />
              {formatDuration(duration)}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="p-5">
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-semibold text-base leading-snug mb-1">
            {truncateText(displayTitle, 100)}
          </h3>
          {displayUser && (
            <p className="flex items-center gap-1 text-text-muted text-sm mt-1">
              <User size={14} />
              {displayUser}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-primary/8">
          {displayViews && (
            <span className="flex items-center gap-1 text-text-muted text-sm">
              <Eye size={14} />
              {displayViews}
            </span>
          )}
          {duration > 0 && (
            <span className="flex items-center gap-1 text-text-muted text-sm">
              <Clock size={14} />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PreviewCard;
