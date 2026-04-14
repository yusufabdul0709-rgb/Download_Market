import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import InstagramReels from './pages/instagram/InstagramReels';
import InstagramPost from './pages/instagram/InstagramPost';
import InstagramAudio from './pages/instagram/InstagramAudio';
import FacebookReels from './pages/facebook/FacebookReels';
import FacebookPost from './pages/facebook/FacebookPost';
import FacebookAudio from './pages/facebook/FacebookAudio';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/instagram/reels" element={<InstagramReels />} />
        <Route path="/instagram/post" element={<InstagramPost />} />
        <Route path="/instagram/audio" element={<InstagramAudio />} />
        <Route path="/facebook/reels" element={<FacebookReels />} />
        <Route path="/facebook/video" element={<FacebookPost />} />
        <Route path="/facebook/audio" element={<FacebookAudio />} />
        {/* Catch-all 404 route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
