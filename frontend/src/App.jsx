import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Loader from './components/Loader';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const InstagramReels = lazy(() => import('./pages/instagram/InstagramReels'));
const InstagramPost = lazy(() => import('./pages/instagram/InstagramPost'));
const InstagramAudio = lazy(() => import('./pages/instagram/InstagramAudio'));
const FacebookReels = lazy(() => import('./pages/facebook/FacebookReels'));
const FacebookPost = lazy(() => import('./pages/facebook/FacebookPost'));
const FacebookAudio = lazy(() => import('./pages/facebook/FacebookAudio'));
const YoutubeVideo = lazy(() => import('./pages/youtube/YoutubeVideo'));
const YoutubeShorts = lazy(() => import('./pages/youtube/YoutubeShortsPage'));
const NotFound = lazy(() => import('./pages/NotFound'));
const SeoLandingPage = lazy(() => import('./pages/SeoLandingPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

function App() {
  return (
    <Suspense fallback={<Loader text="Fetching video..." />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/youtube/video" element={<YoutubeVideo />} />
          <Route path="/youtube/shorts" element={<YoutubeShorts />} />
          <Route path="/instagram/reels" element={<InstagramReels />} />
          <Route path="/instagram/post" element={<InstagramPost />} />
          <Route path="/instagram/audio" element={<InstagramAudio />} />
          <Route path="/facebook/reels" element={<FacebookReels />} />
          <Route path="/facebook/post" element={<FacebookPost />} />
          <Route path="/facebook/audio" element={<FacebookAudio />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/youtube-shorts-downloader"
            element={<SeoLandingPage platform="YouTube Shorts" />}
          />
          <Route
            path="/instagram-reels-downloader"
            element={<SeoLandingPage platform="Instagram Reels" />}
          />
          <Route
            path="/facebook-video-downloader"
            element={<SeoLandingPage platform="Facebook Video" />}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
