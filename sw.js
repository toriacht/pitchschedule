const CACHE_NAME = 'pitch-schedule-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './crest.png',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Only handle same-origin GET requests -- the app shell (HTML/CSS/JS/icons).
  // Never intercept the live schedule data fetch (Apps Script / Sheets),
  // which is on a different origin anyway and must always hit the network
  // fresh, never served from cache.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  // Network-first, cache as a fallback -- not cache-first. This matters
  // because the app shell gets edited often; cache-first would keep serving
  // a stale index.html indefinitely until the cache version is manually
  // bumped. Network-first means normal online visitors always get the
  // current version, and the cache just quietly stays fresh as a side
  // effect, only actually used when there's no network at all.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
