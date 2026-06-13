const CACHE = 'compliance-bible-clean-slate-v20260613-1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js',
  './src/styles/base.css',
  './src/styles/docs/final-layout.css',
  './src/styles/docs/status-switch.css',
  './src/styles/layout/fixed-bars.css',
  './src/styles/docs/finder.css',
  './src/styles/docs/add.css',
  './src/styles/checks/fire.css',
  './src/styles/checks/kitchen.css',
  './src/styles/ui/expanders.css',
  './src/styles/s01.css',
  './src/styles/s02.css',
  './src/styles/s03.css',
  './src/styles/s04.css',
  './src/styles/s05.css',
  './src/main.js',
  './src/core/checklist-edit.js',
  './src/core/app-extension.js',
  './src/rota/bridge.js',
  './src/users/users.js',
  './src/users/document-requirements.js',
  './src/rota/home-integration.js',
  './src/documents/hub.js',
  './src/rota/embed.js',
  './src/core/shell-polish.js',
  './src/ui/profile-circle.js',
  './src/ui/home-status.js',
  './src/documents/document-system.js',
  './src/ui/approved-layout.js',
  './src/documents/finder.js',
  './src/documents/add-document.js',
  './src/checks/fire-safety.js',
  './src/checks/kitchen-safety.js',
  './src/checks/expanders.js',
  './src/users/modal-buttons.js',
  './src/settings/check-buttons.js',
  './src/settings/settings-hub.js',
  './src/checks/area-groups.js'
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