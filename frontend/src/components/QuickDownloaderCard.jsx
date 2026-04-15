import { useState } from 'react';

const QuickDownloaderCard = () => {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [downloadLink, setDownloadLink] = useState('');

  const downloadVideo = async () => {
    setDownloadLink('');
    setStatus('Fetching...');

    try {
      const res = await fetch('/api/download/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('Success');
        setDownloadLink(data.data?.download || '');
      } else {
        setStatus(data.message || 'Server error');
      }
    } catch {
      setStatus('Server error');
    }
  };

  return (
    <div className="min-h-[420px] bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center rounded-2xl p-4">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Video Downloader</h1>

        <input
          id="urlInput"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste video link..."
          className="w-full p-3 border rounded-lg mb-4"
        />

        <button
          type="button"
          onClick={downloadVideo}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg"
        >
          Download
        </button>

        <div id="status" className="mt-4 text-center">
          {status && <p className={status === 'Success' ? 'text-green-600' : 'text-red-500'}>{status}</p>}
          {downloadLink && (
            <a className="text-indigo-600 underline" href={downloadLink}>
              Download
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickDownloaderCard;
