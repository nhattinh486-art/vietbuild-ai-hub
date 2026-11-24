const MAIN_CACHE_NAME = 'dtu-xaydung-main-pwa-v3';
const MAIN_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  '/logo-khoa-xay-dung-dtu.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(MAIN_CACHE_NAME).then((cache) => cache.addAll(MAIN_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k.startsWith('dtu-xaydung-main-pwa-') && k !== MAIN_CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const reqUrl = event.request.url;
  // Không cache các request API Gemini / Firebase
  if (reqUrl.includes('googleapis.com') || reqUrl.includes('firebasedatabase.app')) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res && res.status === 200 && reqUrl.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(MAIN_CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
