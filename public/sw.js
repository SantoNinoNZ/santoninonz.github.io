const CACHE_NAME = 'santo-nino-nz-v2';
const STATIC_ASSETS = [
  '/santonino.svg',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  // Take control immediately without waiting for old SW to release
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  // Claim all clients so this SW controls pages immediately
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) =>
        Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always fetch HTML from the network so deploys take effect immediately
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Next.js build chunks change hash on every build — always go to network
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for true static assets (SVG, manifest, icons, fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
