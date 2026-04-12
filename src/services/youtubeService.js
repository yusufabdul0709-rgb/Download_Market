/**
 * YouTube API Service
 * 
 * Currently uses mock data. When backend is ready,
 * uncomment the axios calls and remove mock implementations.
 */
// import axiosInstance from '../utils/axiosInstance';
// import API_ENDPOINTS from '../utils/apiEndpoints';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch YouTube video details and download links
 * @param {string} url - YouTube video URL
 * @returns {Promise<object>} Video data with download options
 */
export const fetchYouTubeVideo = async (url) => {
  // --- MOCK IMPLEMENTATION ---
  await delay(1500 + Math.random() * 1000);

  // Simulate occasional errors
  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch video. Please try again.');
  }

  return {
    success: true,
    data: {
      id: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      channel: 'Rick Astley',
      channelAvatar: 'https://i.pravatar.cc/40?img=12',
      thumbnail: 'https://picsum.photos/seed/ytvideo1/640/360',
      duration: 213,
      views: '1.5B views',
      publishedAt: '2009-10-25',
      description: 'The official video for "Never Gonna Give You Up" by Rick Astley.',
      formats: [
        { quality: '360p', format: 'mp4', size: 15728640, label: 'SD 360p' },
        { quality: '720p', format: 'mp4', size: 52428800, label: 'HD 720p' },
        { quality: '1080p', format: 'mp4', size: 104857600, label: 'Full HD 1080p' },
        { quality: '128kbps', format: 'mp3', size: 3407872, label: 'MP3 Audio' },
      ],
    },
  };

  // --- REAL IMPLEMENTATION (uncomment when backend is ready) ---
  // const response = await axiosInstance.post(API_ENDPOINTS.youtube.video, { url });
  // return response.data;
};

/**
 * Fetch YouTube Shorts details and download links
 * @param {string} url - YouTube Shorts URL
 * @returns {Promise<object>} Shorts data with download options
 */
export const fetchYouTubeShorts = async (url) => {
  await delay(1200 + Math.random() * 800);

  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch shorts. Please try again.');
  }

  return {
    success: true,
    data: {
      id: 'shorts_abc123',
      title: 'Amazing Nature Timelapse 🌿 #shorts #nature',
      channel: 'Nature Vibes',
      channelAvatar: 'https://i.pravatar.cc/40?img=25',
      thumbnail: 'https://picsum.photos/seed/ytshorts1/360/640',
      duration: 58,
      views: '12M views',
      publishedAt: '2024-06-15',
      isVertical: true,
      formats: [
        { quality: '360p', format: 'mp4', size: 5242880, label: 'SD 360p' },
        { quality: '720p', format: 'mp4', size: 15728640, label: 'HD 720p' },
        { quality: '1080p', format: 'mp4', size: 31457280, label: 'Full HD 1080p' },
        { quality: '128kbps', format: 'mp3', size: 921600, label: 'MP3 Audio' },
      ],
    },
  };
};
