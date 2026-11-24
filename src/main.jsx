import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ToiletPuzzle from './minigames/ToiletPuzzle.jsx';
import './index.css';

const AdminDashboard = React.lazy(() => import('./admin/AdminDashboard.jsx'));

const preventIosZoom = (event) => {
  if (event.touches?.length > 1) {
    event.preventDefault();
  }
};

document.addEventListener('gesturestart', (event) => event.preventDefault());
document.addEventListener('gesturechange', (event) => event.preventDefault());
document.addEventListener('gestureend', (event) => event.preventDefault());
document.addEventListener('touchmove', preventIosZoom, { passive: false });

const updateDisplayModeClass = () => {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  document.documentElement.classList.toggle('is-standalone', isStandalone);
};

const displayModeQuery = window.matchMedia('(display-mode: standalone)');
updateDisplayModeClass();
if (displayModeQuery.addEventListener) {
  displayModeQuery.addEventListener('change', updateDisplayModeClass);
} else if (displayModeQuery.addListener) {
  displayModeQuery.addListener(updateDisplayModeClass);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {window.location.pathname === '/admin'
      ? <React.Suspense fallback={<p style={{padding:32}}>개발자 대시보드를 불러오는 중…</p>}><AdminDashboard /></React.Suspense>
      : window.location.pathname === '/minigame' ? <ToiletPuzzle /> : <App />}
  </React.StrictMode>
);

// A previously installed local production worker can cache Vite source modules.
// Release it in development so navigation doesn't restore an older game UI.
if ('serviceWorker' in navigator && import.meta.env.DEV) {
  navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    if (!registrations.length) return;
    const removed = await Promise.all(registrations.map(registration => registration.unregister()));
    if (removed.some(Boolean) && navigator.serviceWorker.controller) window.location.reload();
  }).catch(error => console.warn('Development service worker cleanup failed:', error));
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}
