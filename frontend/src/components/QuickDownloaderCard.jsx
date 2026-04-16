import { useState } from 'react';

const QuickDownloaderCard = () => {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleDownload = async () => {
    try {
      setLoading(true);
      setStatus('Fetching...');
      const res = await fetch(`/api/download?url=${encodeURIComponent(inputUrl)}`);
      const data = await res.json();

      if (data.error) {
        alert(`Error: ${data.error}`);
        setStatus(data.error);
        return;
      }

      window.open(data.downloadUrl, '_blank');
      setStatus('Success');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      alert('Something went wrong!');
      setStatus('Server error');
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
          {loading ? 'Fetching...' : 'Download'}
        </button>

        <div id="status" className="mt-4 text-center">
          {status && <p className={status === 'Success' ? 'text-green-600' : 'text-red-500'}>{status}</p>}
        </div>
      </div>
    </div>
  );
};

export default QuickDownloaderCard;
