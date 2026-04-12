/**
 * Instagram API Service
 *
 * Currently uses mock data. When backend is ready,
 * uncomment the axios calls and remove mock implementations.
 */
// import axiosInstance from '../utils/axiosInstance';
// import API_ENDPOINTS from '../utils/apiEndpoints';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch Instagram Reel details and download links
 * @param {string} url - Instagram Reel URL
 * @returns {Promise<object>} Reel data with download option
 */
export const fetchInstagramReel = async (url) => {
  await delay(1400 + Math.random() * 1000);

  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch reel. Please try again.');
  }

  return {
    success: true,
    data: {
      id: 'reel_xyz789',
      type: 'reel',
      username: 'travel_explorer',
      userAvatar: 'https://i.pravatar.cc/40?img=33',
      caption: 'Exploring the hidden gems of Bali 🌴✨ #travel #bali #explore',
      thumbnail: 'https://picsum.photos/seed/igreel1/360/640',
      duration: 30,
      likes: '245K',
      comments: '1.2K',
      isVertical: true,
      formats: [
        { quality: '720p', format: 'mp4', size: 10485760, label: 'HD 720p' },
        { quality: '1080p', format: 'mp4', size: 20971520, label: 'Full HD 1080p' },
      ],
    },
  };
};

/**
 * Fetch Instagram Post details (supports carousel)
 * @param {string} url - Instagram Post URL
 * @returns {Promise<object>} Post data with media items
 */
export const fetchInstagramPost = async (url) => {
  await delay(1600 + Math.random() * 1000);

  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch post. Please try again.');
  }

  return {
    success: true,
    data: {
      id: 'post_abc456',
      type: 'carousel',
      username: 'photography_world',
      userAvatar: 'https://i.pravatar.cc/40?img=44',
      caption: 'Golden hour magic ☀️📸 Swipe for more frames! #photography #goldenhour',
      likes: '89K',
      comments: '432',
      mediaItems: [
        {
          id: 'media_1',
          type: 'image',
          url: 'https://picsum.photos/seed/igpost1/1080/1080',
          thumbnail: 'https://picsum.photos/seed/igpost1/400/400',
        },
        {
          id: 'media_2',
          type: 'image',
          url: 'https://picsum.photos/seed/igpost2/1080/1080',
          thumbnail: 'https://picsum.photos/seed/igpost2/400/400',
        },
        {
          id: 'media_3',
          type: 'video',
          url: 'https://picsum.photos/seed/igpost3/1080/1080',
          thumbnail: 'https://picsum.photos/seed/igpost3/400/400',
          duration: 15,
        },
        {
          id: 'media_4',
          type: 'image',
          url: 'https://picsum.photos/seed/igpost4/1080/1080',
          thumbnail: 'https://picsum.photos/seed/igpost4/400/400',
        },
      ],
    },
  };
};

/**
 * Fetch Instagram Audio from Reel
 * @param {string} url - Instagram Reel URL
 * @returns {Promise<object>} Audio data with download option
 */
export const fetchInstagramAudio = async (url) => {
  await delay(1300 + Math.random() * 800);

  if (Math.random() < 0.05) {
    throw new Error('Failed to extract audio. Please try again.');
  }

  return {
    success: true,
    data: {
      id: 'audio_def321',
      type: 'audio',
      title: 'Original Audio - @music_beats',
      artist: 'music_beats',
      artistAvatar: 'https://i.pravatar.cc/40?img=55',
      duration: 28,
      coverArt: 'https://picsum.photos/seed/igaudio1/400/400',
      usageCount: '15.2K reels',
      formats: [
        { quality: '128kbps', format: 'mp3', size: 448000, label: 'MP3 128kbps' },
        { quality: '320kbps', format: 'mp3', size: 1120000, label: 'MP3 320kbps' },
      ],
    },
  };
};
