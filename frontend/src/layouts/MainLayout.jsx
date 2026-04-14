import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IframeAdBanner from '../components/IframeAdBanner';
import AdBanner from '../components/AdBanner';
import AdPlaceholder from '../components/AdPlaceholder';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid rgba(99, 102, 241, 0.12)',
            borderRadius: '16px',
            fontSize: '14px',
            padding: '12px 16px',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.10)',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
          },
        }}
      />

      {/* ── Top Banner Ad (above the fold) ── */}
      <div className="ad-top-bar" id="ad-top">
        <IframeAdBanner id="ad-top-iframe" />
      </div>

      <Navbar />

      {/* ── Desktop Sidebar Ad (right gutter, only on wide screens) ── */}
      <div className="ad-sidebar-rail right" id="ad-sidebar">
        <AdBanner />
      </div>

      <main className="flex-1 pt-20">
        <Outlet />
      </main>

      <Footer />

      {/* ── Sticky Bottom Mobile Ad ── */}
      <div className="ad-sticky-bottom block md:hidden" id="ad-sticky">
        <IframeAdBanner id="ad-sticky-iframe" />
      </div>
    </div>
  );
};

export default MainLayout;
