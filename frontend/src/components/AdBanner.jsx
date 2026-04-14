import { useEffect, useRef } from 'react';

const AdBanner = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    
    // Prevent multiple injections
    if (bannerRef.current.childNodes.length > 0) return;

    // The script expects this container element
    const container = document.createElement('div');
    container.id = 'container-751308d4320150fcca2bc21e2855dd55';
    
    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = 'https://pl29145625.profitablecpmratenetwork.com/751308d4320150fcca2bc21e2855dd55/invoke.js';

    bannerRef.current.appendChild(container);
    bannerRef.current.appendChild(script);

    return () => {
      // Cleanup when component unmounts
      if (bannerRef.current) {
        bannerRef.current.innerHTML = '';
      }
    };
  }, []);

  return (
    <div className="w-full flex justify-center my-6 relative z-50">
      <div ref={bannerRef}></div>
    </div>
  );
};

export default AdBanner;
