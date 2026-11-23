const CACHE_NAME = 'poop-pr-shell-v31';
const SKIN_CACHE = 'poop-pr-skins-v1';
const SKIN_CACHE_LIMIT = 180;
const skinRequests = new Map();

async function skinResponse(request) {
  const cache = await caches.open(SKIN_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  // Share concurrent requests for the same equipped image and preview.
  if (!skinRequests.has(request.url)) {
    const pending = fetch(request).then(async response => {
      if (response.ok && response.headers.get('content-type')?.includes('image/webp')) {
        try {
          await cache.put(request, response.clone());
          const keys = await cache.keys();
          await Promise.all(keys.slice(0, Math.max(0, keys.length - SKIN_CACHE_LIMIT)).map(key => cache.delete(key)));
        } catch { /* Storage full/private mode: still display the fetched image. */ }
      }
      return response;
    }).finally(() => skinRequests.delete(request.url));
    skinRequests.set(request.url, pending);
  }
  return (await skinRequests.get(request.url)).clone();
}
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/pwa-icon-maskable-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith('poop-pr-') && key !== CACHE_NAME && key !== SKIN_CACHE).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Only requested skins are cached. Do not prefetch the collection or revalidate hits.
  if (/^\/skins\/[a-z0-9_.-]+\.[a-f0-9]{16}\.webp$/.test(url.pathname)) {
    event.respondWith(skinResponse(request));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkResponse = fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match('/');
          }
          return cachedResponse;
        });

      return cachedResponse || networkResponse;
    })
  );
});
