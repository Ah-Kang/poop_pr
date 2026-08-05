import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

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
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error);
    });
  });
}
