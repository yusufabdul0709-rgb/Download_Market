import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for fetching media from mock API services
 * Handles loading, error states, and toast notifications
 */
const useFetchMedia = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMedia = useCallback(async (serviceFn, url) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await serviceFn(url);
      if (result.success) {
        setData(result.data);
        toast.success('Media fetched successfully!');

        // Save to recent downloads
        const recent = JSON.parse(localStorage.getItem('recentDownloads') || '[]');
        const newEntry = {
          id: Date.now(),
          url,
          title: result.data.title || result.data.caption || 'Untitled',
          thumbnail: result.data.thumbnail || result.data.coverArt || '',
          type: result.data.type || 'video',
          timestamp: new Date().toISOString(),
        };
        const updated = [newEntry, ...recent.filter((r) => r.url !== url)].slice(0, 20);
        localStorage.setItem('recentDownloads', JSON.stringify(updated));
      }
      return result;
    } catch (err) {
      const message = err.message || 'Something went wrong';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setLoading(false);
    setError(null);
  }, []);

  return { data, loading, error, fetchMedia, reset };
};

export default useFetchMedia;
