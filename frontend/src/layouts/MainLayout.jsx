import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import IframeAdBanner from '../components/IframeAdBanner';

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

      <Navbar />

      <main className="flex-1 pt-20">
        {/* ── #ad-top — Top Banner Ad (below navbar, above the fold) ── */}
        <div className="w-full flex justify-center py-3 bg-white/50 border-b border-primary/5" id="ad-top">
          <IframeAdBanner id="ad-top-banner" />
        </div>

        <Outlet />
      </main>

      {/* ── #ad-footer — Footer Ad (above footer, every page) ── */}
      <div className="w-full flex justify-center py-4" id="ad-footer">
        <IframeAdBanner id="ad-footer-global-iframe" />
      </div>

      <Footer />

      {/* ── Sticky Bottom Mobile Ad ── */}
      <div className="ad-sticky-bottom block md:hidden" id="ad-sticky">
        <IframeAdBanner id="ad-sticky-iframe" />
      </div>

      {/* ── Sidebar Sticky Ads (Desktop > 1440px) ── */}
      <div className="ad-sidebar-rail left" id="ad-sidebar-left">
        <IframeAdBanner id="ad-sidebar-left-iframe" width={160} height={600} />
      </div>
      <div className="ad-sidebar-rail right" id="ad-sidebar-right">
        <IframeAdBanner id="ad-sidebar-right-iframe" width={160} height={600} />
      </div>
    </div>
  );
};

export default MainLayout;
