const CACHE = 'compliance-bible-v20260612-7';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './final-document-system.js',
  './document-neutral-hard.css',
  './document-badge-switch-fix.css',
  './app-approved-layout.js',
  './app-fixed-banners.css',
  './app-doc-finder-dropdown.js',
  './app-doc-finder-dropdown.css',
  './app-add-premises-fix.js',
  './app-add-premises-fix.css',
  './app-fire-safety-system.js',
  './app-fire-safety-system.css',
  './app-unified-expanders.css',
  './app-check-expanders.js',
  './app-check-expanders.css',
  './app-user-buttons-modal.js',
  './app-user-buttons-modal.css'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});