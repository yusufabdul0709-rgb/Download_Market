import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const pageMap = {
  'YouTube Shorts': {
    path: '/youtube/shorts',
    title: 'YouTube Shorts Downloader',
    description: 'Download YouTube Shorts quickly in HD quality. Paste URL, fetch details, and save to your device.',
    keywords: 'youtube shorts downloader, download youtube shorts, shorts video download',
  },
  'Instagram Reels': {
    path: '/instagram/reels',
    title: 'Instagram Reels Downloader',
    description: 'Download Instagram Reels in high quality with a fast and reliable workflow.',
    keywords: 'instagram reels downloader, download instagram reels, instagram reel saver',
  },
  'Facebook Video': {
    path: '/facebook/post',
    title: 'Facebook Video Downloader',
    description: 'Download Facebook videos with stable extraction and clear download options.',
    keywords: 'facebook video downloader, download facebook video, facebook reel downloader',
  },
};

const SeoLandingPage = ({ platform }) => {
  const cfg = pageMap[platform] || pageMap['YouTube Shorts'];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <SEOHead title={cfg.title} description={`${cfg.description} Keywords: ${cfg.keywords}.`} />
      <h1 className="text-3xl font-bold text-text-primary mb-4">{cfg.title}</h1>
      <p className="text-text-secondary mb-6">{cfg.description}</p>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">How to use</h2>
        <ol className="list-decimal pl-5 space-y-2 text-text-secondary">
          <li>Copy the public video URL from the platform.</li>
          <li>Paste it into the downloader input box.</li>
          <li>Click fetch and choose your preferred quality.</li>
          <li>Tap download and wait for the file to be ready.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">FAQ</h2>
        <div className="space-y-3 text-text-secondary">
          <p><strong>Is this free?</strong> Yes, the downloader is free to use.</p>
          <p><strong>Do you store content?</strong> No, we do not store downloaded content.</p>
          <p><strong>What if download fails?</strong> Retry after a moment or use another public URL.</p>
        </div>
      </section>

      <Link to={cfg.path} className="inline-block px-5 py-3 rounded-xl bg-primary text-white font-semibold">
        Open {cfg.title}
      </Link>
    </div>
  );
};

export default SeoLandingPage;
