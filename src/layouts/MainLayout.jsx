import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-bg-dark">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1E293B',
            color: '#F1F5F9',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '16px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#22C55E', secondary: '#F1F5F9' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#F1F5F9' },
          },
        }}
      />
      <Navbar />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
