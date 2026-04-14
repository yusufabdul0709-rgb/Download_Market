import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';
import { formatDuration } from '../utils/helpers';

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
      
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 font-medium z-20">
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
    media
  } = data;

  const displayTitle = title || caption || 'Untitled';
  const displayImage = thumbnail || coverArt || (media && media[0]?.thumbnail) || (media && media[0]?.url);

  const renderMedia = () => {
    if (type === 'carousel' && media && media.length > 1) {
      return <CarouselViewer media={media} />;
    }

    return (
      <div
        className={`relative overflow-hidden bg-bg-surface-light ${
          isVertical ? 'aspect-[4/5] sm:aspect-[9/16]' : 'aspect-square sm:aspect-video'
        } rounded-t-2xl shadow-inner`}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={displayTitle}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
             <ImageIcon size={48} />
           </div>
        )}
        
        {/* Play overlay for video types */}
        {(type === 'video' || type === 'short') && displayImage && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="w-16 h-16 bg-white/40 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <Play size={28} className="text-primary ml-1" fill="currentColor" />
            </div>
          </div>
        )}
        
        {/* Image overlay */}
        {type === 'image' && displayImage && (
           <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 font-medium z-10">
             <ImageIcon size={14} /> Photo
           </div>
        )}
        
        {/* Duration badge */}
        {duration > 0 && (type === 'video' || type === 'audio') && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg text-xs text-white font-medium z-10">
            <Clock size={12} />
            {formatDuration(duration)}
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full"
    >
      {renderMedia()}
    </motion.div>
  );
};

export default PreviewCard;
