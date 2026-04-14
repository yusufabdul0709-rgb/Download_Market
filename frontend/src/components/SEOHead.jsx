import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Dynamic SEO component — updates document title and meta description
 * per page for better search engine ranking. Also sets canonical URL.
 */
const SEOHead = ({ title, description }) => {
  const location = useLocation();

  useEffect(() => {
    // Update title
    document.title = title
      ? `${title} | Download Market`
      : 'Download Market - Free YouTube & Instagram Video Downloader';

    // Update meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content =
      description ||
      'Download Market - Download videos, reels, shorts, posts and audio from YouTube and Instagram for free. Fast, safe, HD quality.';

    // Set canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${location.pathname}`;

    // Open Graph tags
    const setOG = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.content = content;
    };
    setOG('og:title', title || 'Download Market');
    setOG('og:description', description || 'Free YouTube & Instagram downloader');
    setOG('og:type', 'website');
    setOG('og:url', `${window.location.origin}${location.pathname}`);
  }, [title, description, location.pathname]);

  return null;
};

export default SEOHead;
