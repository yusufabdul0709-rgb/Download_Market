import { useEffect, useRef } from 'react';

const AdBanner = () => {
  const bannerRef = useRef(null);

  useEffect(() => {
    if (!bannerRef.current) return;
    
    // Prevent multiple injections
    if (bannerRef.current.childNodes.length > 0) return;

    // The script expects this container element
    const container = document.createElement('div');
    container.id = 'container-a950cf8347a21b6b8cd24a211708b7dd';
    
    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.dataset.cfasync = 'false';
    script.src = 'https://pl29148133.profitablecpmratenetwork.com/a950cf8347a21b6b8cd24a211708b7dd/invoke.js';

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
