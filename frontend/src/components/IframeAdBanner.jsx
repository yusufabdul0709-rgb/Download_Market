import { useEffect, useRef } from 'react';

/**
 * Adsterra 468x60 Iframe Ad Banner.
 * Injects the atOptions config + invoke.js script dynamically.
 * Scales down responsively on smaller screens via CSS transform.
 */
const IframeAdBanner = ({ id = 'ad-banner', className = '' }) => {
  const containerRef = useRef(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || injectedRef.current) return;
    injectedRef.current = true;

    // Inject the atOptions config script
    const configScript = document.createElement('script');
    configScript.type = 'text/javascript';
    configScript.textContent = `
      atOptions = {
        'key' : 'cb270c0ac9bbab8c47134da31a43b888',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    // Inject the invoke script
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/cb270c0ac9bbab8c47134da31a43b888/invoke.js';

    containerRef.current.appendChild(configScript);
    containerRef.current.appendChild(invokeScript);

    return () => {
      injectedRef.current = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div
      id={id}
      className={`ad-iframe-wrapper flex justify-center ${className}`}
    >
      <div ref={containerRef} className="ad-iframe-inner" />
    </div>
  );
};

export default IframeAdBanner;
