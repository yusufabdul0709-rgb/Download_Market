/**
 * Instagram API Service
 *
 * Calls the backend /api/preview endpoint to get media metadata.
 * Falls back to mock data if the backend is not available.
 */
import axiosInstance from '../utils/axiosInstance';
import API_ENDPOINTS from '../utils/apiEndpoints';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Mock data for offline / no-backend fallback ──────────────────────────────

const MOCK_REEL = {
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

const MOCK_POST = {
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

const MOCK_AUDIO = {
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

/**
 * Helper: transform backend preview response for Instagram Reel.
 */
function transformReelResponse(response, url) {
  const { title, thumbnail, duration, uploader, formats } = response;

  const formattedFormats = (formats || []).map((f) => ({
    quality: f.quality,
    format: 'mp4',
    size: null,
    label: f.quality,
    formatId: f.formatId,
  }));

  return {
    success: true,
    data: {
      id: url,
      type: 'reel',
      username: uploader || 'unknown',
      userAvatar: null,
      caption: title || 'Instagram Reel',
      thumbnail: thumbnail || 'https://picsum.photos/seed/fallback/360/640',
      duration: duration || 0,
      likes: null,
      comments: null,
      isVertical: true,
      formats: formattedFormats,
    },
  };
}

/**
 * Fetch Instagram Reel details and download links
 * @param {string} url - Instagram Reel URL
 * @returns {Promise<object>} Reel data with download option
 */
export const fetchInstagramReel = async (url) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.preview, { url });
    return transformReelResponse(response.data, url);
  } catch (err) {
    console.warn('[Instagram Service] Backend unavailable, using mock data', err.message);
    await delay(1400);
    return MOCK_REEL;
  }
};

/**
 * Fetch Instagram Post details (supports carousel)
 * @param {string} url - Instagram Post URL
 * @returns {Promise<object>} Post data with media items
 */
export const fetchInstagramPost = async (url) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.preview, { url });
    const { title, thumbnail, uploader } = response.data;
    return {
      success: true,
      data: {
        id: url,
        type: 'single',
        username: uploader || 'unknown',
        userAvatar: null,
        caption: title || 'Instagram Post',
        likes: null,
        comments: null,
        mediaItems: [
          {
            id: 'media_1',
            type: 'image',
            url: thumbnail || 'https://picsum.photos/seed/fallback/1080/1080',
            thumbnail: thumbnail || 'https://picsum.photos/seed/fallback/400/400',
          },
        ],
      },
    };
  } catch (err) {
    console.warn('[Instagram Service] Backend unavailable, using mock data', err.message);
    await delay(1600);
    return MOCK_POST;
  }
};

/**
 * Fetch Instagram Audio from Reel
 * @param {string} url - Instagram Reel URL
 * @returns {Promise<object>} Audio data with download option
 */
export const fetchInstagramAudio = async (url) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.preview, { url });
    const { title, thumbnail, duration, uploader } = response.data;
    return {
      success: true,
      data: {
        id: url,
        type: 'audio',
        title: title || 'Instagram Audio',
        artist: uploader || 'unknown',
        artistAvatar: null,
        duration: duration || 0,
        coverArt: thumbnail || 'https://picsum.photos/seed/fallback/400/400',
        usageCount: null,
        formats: [
          { quality: '128kbps', format: 'mp3', size: null, label: 'MP3 128kbps' },
          { quality: '320kbps', format: 'mp3', size: null, label: 'MP3 320kbps' },
        ],
      },
    };
  } catch (err) {
    console.warn('[Instagram Service] Backend unavailable, using mock data', err.message);
    await delay(1300);
    return MOCK_AUDIO;
  }
};
