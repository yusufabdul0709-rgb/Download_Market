import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import YouTubeVideo from './pages/youtube/YouTubeVideo';
import YouTubeShorts from './pages/youtube/YouTubeShorts';
import InstagramReels from './pages/instagram/InstagramReels';
import InstagramPost from './pages/instagram/InstagramPost';
import InstagramAudio from './pages/instagram/InstagramAudio';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/youtube/video" element={<YouTubeVideo />} />
        <Route path="/youtube/shorts" element={<YouTubeShorts />} />
        <Route path="/instagram/reels" element={<InstagramReels />} />
        <Route path="/instagram/post" element={<InstagramPost />} />
        <Route path="/instagram/audio" element={<InstagramAudio />} />
      </Route>
    </Routes>
  );
}

export default App;
