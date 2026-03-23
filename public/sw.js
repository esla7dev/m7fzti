const CACHE_NAME = 'finance-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
];

// Install — cache static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for navigation, stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET and cross-origin API calls
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Skip Vite HMR / dev server internal requests
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/__') || url.pathname.startsWith('/node_modules/') || url.pathname.startsWith('/src/')) return;

  // Navigation requests — network first, fall back to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/offline.html').then((cached) => cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/html' } }))
        )
    );
    return;
  }

  // JS/CSS/images — stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise.then((res) => res || new Response('', { status: 404 }));
    })
  );
});
