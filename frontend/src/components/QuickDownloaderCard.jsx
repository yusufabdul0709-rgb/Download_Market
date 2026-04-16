import { useState } from 'react';

const MAX_POLLS = 60;
const POLL_INTERVAL_MS = 2000;

function detectPlatform(url) {
  try {
    const { hostname } = new URL(url);
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('instagram.com')) {
      return 'instagram';
    }
    if (hostname.includes('facebook.com') || hostname.includes('fb.com') || hostname.includes('fb.watch')) {
      return 'facebook';
    }
  } catch {
    // invalid URL — fall through
  }
  return 'unknown';
}

const QuickDownloaderCard = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleDownload = async () => {
    if (!inputUrl.trim()) return;

    setLoading(true);
    setError('');
    setStatus('Starting download…');

    try {
      const detectedPlatform = detectPlatform(inputUrl);

      // POST to /api/download to create the async job
      const postRes = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl, platform: detectedPlatform, type: 'video' }),
      });

      const postData = await postRes.json();

      if (!postRes.ok || !postData.jobId) {
        const msg = postData.message || postData.error || 'Failed to start download';
        setError(msg);
        setStatus('');
        return;
      }

      const { jobId } = postData;
      setStatus('Processing…');

      // Poll GET /api/download/:jobId every 2 seconds, up to MAX_POLLS times
      let polls = 0;
      while (polls < MAX_POLLS) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        polls += 1;

        const pollRes = await fetch(`/api/download/${jobId}`);
        const data = await pollRes.json();

        if (data.status === 'completed') {
          setStatus('Downloading file…');

          // Trigger browser native file download
          const a = document.createElement('a');
          a.href = data.downloadUrl;
          a.download = '';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setStatus('Done!');
          return;
        }

        if (data.status === 'failed') {
          const msg = data.message || 'Download failed';
          setError(msg);
          setStatus('');
          return;
        }

        // Still queued / processing — keep polling
        setStatus('Processing…');
      }

      // Exceeded max polls
      setError('Download timed out. Please try again.');
      setStatus('');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(err.message || 'Something went wrong');
      setStatus('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[420px] bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center rounded-2xl p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Video Downloader</h1>

        <input
          id="urlInput"
          type="text"
          value={inputUrl}
          onChange={(e) => setInputUrl(e.target.value)}
          placeholder="Paste video link..."
          className="w-full p-3 border rounded-lg mb-4"
        />

        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg"
        >
          {loading ? status || 'Processing…' : 'Download'}
        </button>

        <div id="status" className="mt-4 text-center">
          {status && !error && (
            <p className={status === 'Done!' ? 'text-green-600' : 'text-gray-600'}>{status}</p>
          )}
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default QuickDownloaderCard;
