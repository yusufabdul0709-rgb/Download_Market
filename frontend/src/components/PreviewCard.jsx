import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Eye, User, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { formatDuration, truncateText } from '../utils/helpers';

const CarouselViewer = ({ media }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  return (
    <div className="relative w-full aspect-square md:aspect-video bg-black/5 rounded-t-2xl overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="absolute inset-0"
        >
          <img
            src={media[currentIndex].thumbnail || media[currentIndex].url}
            alt={`Slide ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
        {media.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === currentIndex ? 'bg-primary w-4' : 'bg-white/60 hover:bg-white'}`}
          />
        ))}
      </div>
      
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 font-medium">
        <ImageIcon size={14} />
        {currentIndex + 1} / {media.length}
      </div>
    </div>
  );
};

const PreviewCard = ({ data, isVertical = false }) => {
  if (!data) return null;

  const {
    type,
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
    media
  } = data;

  const displayTitle = title || caption || 'Untitled';
  const displayImage = thumbnail || coverArt || (media && media[0]?.thumbnail) || (media && media[0]?.url);
  const displayUser = channel || username || uploader;
  const displayViews = views || (viewCount ? `${(viewCount / 1000000).toFixed(1)}M views` : null);

  const renderMedia = () => {
    if (type === 'carousel' && media && media.length > 1) {
      return <CarouselViewer media={media} />;
    }

    return (
      <div
        className={`relative overflow-hidden bg-bg-surface-light ${
          isVertical ? 'aspect-[9/16]' : 'aspect-video'
        } rounded-t-2xl`}
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
        {/* Play overlay for video types */}
        {(type === 'video' || type === 'short') && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <Play size={28} className="text-primary ml-1" fill="currentColor" />
            </div>
          </div>
        )}
        {/* Image overlay */}
        {type === 'image' && (
           <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 font-medium">
             <ImageIcon size={14} /> Photo
           </div>
        )}
        {/* Duration badge */}
        {duration > 0 && (type === 'video' || type === 'audio') && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium">
            <Clock size={12} />
            {formatDuration(duration)}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`glass rounded-2xl overflow-hidden ${
        isVertical ? 'max-w-sm mx-auto' : 'w-full'
      }`}
    >
      {renderMedia()}

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
