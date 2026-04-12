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
    channel,
    username,
    channelAvatar,
    userAvatar,
    likes,
    comments,
  } = data;

  const displayTitle = title || caption || 'Untitled';
  const displayImage = thumbnail || coverArt;
  const displayUser = channel || username;
  const displayAvatar = channelAvatar || userAvatar;

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
      <div
        className={`relative overflow-hidden bg-bg-surface ${
          isVertical ? 'aspect-[9/16]' : 'aspect-video'
        }`}
      >
        <img
          src={displayImage}
          alt={displayTitle}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 cursor-pointer">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Play size={28} className="text-white ml-1" fill="white" />
          </div>
        </div>
        {/* Duration badge */}
        {duration && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
            <Clock size={12} />
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5">
        <div className="flex items-start gap-3">
          {displayAvatar && (
            <img
              src={displayAvatar}
              alt={displayUser}
              className="w-10 h-10 rounded-full flex-shrink-0 border-2 border-bg-surface-light"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base leading-snug mb-1">
              {truncateText(displayTitle, 80)}
            </h3>
            {displayUser && (
              <p className="flex items-center gap-1 text-text-muted text-sm">
                <User size={14} />
                {displayUser}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
          {views && (
            <span className="flex items-center gap-1 text-text-muted text-sm">
              <Eye size={14} />
              {views}
            </span>
          )}
          {likes && (
            <span className="text-text-muted text-sm">❤️ {likes}</span>
          )}
          {comments && (
            <span className="text-text-muted text-sm">💬 {comments}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PreviewCard;
