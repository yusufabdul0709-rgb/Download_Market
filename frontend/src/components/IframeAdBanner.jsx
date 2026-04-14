import { useEffect, useRef } from 'react';

/**
 * Adsterra 468x60 Iframe Ad Banner.
 * Injects the atOptions config + invoke.js script dynamically.
 * Scales down responsively on smaller screens via CSS transform.
 */
const IframeAdBanner = ({ id = 'ad-banner', className = '', width = 468, height = 60 }) => {
  return (
    <div
      id={id}
      className={`ad-iframe-wrapper flex justify-center items-center overflow-hidden ${className}`}
      style={{ minHeight: `${height}px` }}
    >
      <iframe
        src="/adsterra.html"
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        title="Advertisement"
        className="max-w-full"
        style={{
          border: 'none',
          overflow: 'hidden',
          display: 'block'
        }}
      />
    </div>
  );
};

export default IframeAdBanner;
