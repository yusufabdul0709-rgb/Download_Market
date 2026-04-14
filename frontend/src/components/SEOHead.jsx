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

    // --- Inject JSON-LD Schema ---
    let schemaScript = document.querySelector('script[id="dynamic-seo-schema"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.type = 'application/ld+json';
      schemaScript.id = 'dynamic-seo-schema';
      document.head.appendChild(schemaScript);
    }
    
    // Build a WebApplication + FAQPage schema
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebApplication",
          "name": title || "Download Market",
          "url": `${window.location.origin}${location.pathname}`,
          "description": description || "Download YouTube and Instagram videos for free in HD.",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "All",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        },
        {
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "Is it free?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes! Download Market is 100% free. No sign-up, no subscription, and no hidden charges. Just paste your link and download."
              }
            },
            {
              "@type": "Question",
              "name": "Do I need login?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "No, you do not need to create an account or provide any personal information. You can use our downloader instantly without logging in."
              }
            },
            {
              "@type": "Question",
              "name": "Is it safe?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. It is completely safe. We don't store any of your data, downloads, or history. All downloads are processed securely on our servers."
              }
            }
          ]
        }
      ]
    };
    
    schemaScript.textContent = JSON.stringify(schemaData);

  }, [title, description, location.pathname]);

  return null;
};

export default SEOHead;
