/**
 * YouTube API Service
 *
 * Calls the backend /api/preview endpoint to get video metadata.
 * Falls back to mock data if the backend is not available.
 */
import axiosInstance from '../utils/axiosInstance';
import API_ENDPOINTS from '../utils/apiEndpoints';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Mock data for offline / no-backend fallback ──────────────────────────────

const MOCK_VIDEO = {
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

const MOCK_SHORTS = {
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

/**
 * Helper: transform backend preview response into the frontend format.
 */
function transformPreviewResponse(response, url) {
  const { title, thumbnail, duration, uploader, viewCount, formats } = response;

  const formattedFormats = (formats || []).map((f) => ({
    quality: f.quality,
    format: 'mp4',
    size: null,
    label: f.quality,
    formatId: f.formatId,
  }));

  // Add an audio option
  formattedFormats.push({
    quality: '128kbps',
    format: 'mp3',
    size: null,
    label: 'MP3 Audio',
    formatId: 'audio',
  });

  return {
    success: true,
    data: {
      id: url,
      title: title || 'Unknown Title',
      channel: uploader || 'Unknown',
      channelAvatar: null,
      thumbnail: thumbnail || 'https://picsum.photos/seed/fallback/640/360',
      duration: duration || 0,
      views: viewCount ? `${(viewCount / 1000000).toFixed(1)}M views` : null,
      publishedAt: null,
      formats: formattedFormats,
    },
  };
}

/**
 * Fetch YouTube video details and download links
 * @param {string} url - YouTube video URL
 * @returns {Promise<object>} Video data with download options
 */
export const fetchYouTubeVideo = async (url) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.preview, { url });
    return transformPreviewResponse(response.data, url);
  } catch (err) {
    console.warn('[YouTube Service] Backend unavailable, using mock data', err.message);
    await delay(1500);
    return MOCK_VIDEO;
  }
};

/**
 * Fetch YouTube Shorts details and download links
 * @param {string} url - YouTube Shorts URL
 * @returns {Promise<object>} Shorts data with download options
 */
export const fetchYouTubeShorts = async (url) => {
  try {
    const response = await axiosInstance.post(API_ENDPOINTS.preview, { url });
    const result = transformPreviewResponse(response.data, url);
    result.data.isVertical = true;
    return result;
  } catch (err) {
    console.warn('[YouTube Service] Backend unavailable, using mock data', err.message);
    await delay(1200);
    return MOCK_SHORTS;
  }
};
