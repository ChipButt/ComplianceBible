const CACHE = 'compliance-bible-clean-slate-v20260618-2';
const ASSETS = [
  './',
  './index.html',
  './rota-app.html',
  './manifest.json',
  './sw.js',
  './src/styles/base.css',
  './src/styles/layout/viewport-reset.css',
  './src/styles/layout/fixed-bars.css',
  './src/styles/docs/final-layout.css',
  './src/styles/docs/status-switch.css',
  './src/styles/docs/finder.css',
  './src/styles/docs/add.css',
  './src/styles/checks/fire.css',
  './src/styles/checks/kitchen.css',
  './src/styles/checks/temperature-compact.css',
  './src/styles/users/users.css',
  './src/styles/settings/settings.css',
  './src/styles/ui/expanders.css',
  './src/styles/ui/chevrons-app-wide.css',
  './src/styles/checks/checks-visual-tune.css',
  './src/styles/ui/shell.css',
  './src/main.js',
  './src/rota/bridge.js',
  './src/users/users.js',
  './src/users/document-requirements.js',
  './src/rota/home-integration.js',
  './src/documents/hub.js',
  './src/ui/profile-circle.js',
  './src/ui/home-status.js',
  './src/documents/document-system.js',
  './src/ui/approved-layout.js',
  './src/checks/fire-safety.js',
  './src/checks/kitchen-safety.js',
  './src/users/modal-buttons.js',
  './src/settings/check-buttons.js',
  './src/settings/settings-hub.js',
  './src/checks/area-groups.js',
  './src/core/bootstrap.js',
  './src/rota/schedule-embed.css',
  './src/rota/schedule-embed.js',
  './src/rota/vendor/styles.css',
  './src/rota/vendor/schedule-admin-overrides.css',
  './src/rota/vendor/final-ui-overrides.css',
  './src/rota/vendor/hard-schedule-fix.css',
  './src/rota/vendor/schedule-shift-block.css',
  './src/rota/vendor/app.js',
  './src/rota/vendor/validation-patch.js',
  './src/rota/vendor/rota-planning-patch.js',
  './src/rota/vendor/payroll-breaks-patch.js',
  './src/rota/vendor/unassigned-shifts-patch.js',
  './src/rota/vendor/pronouns-salary-patch.js',
  './src/rota/vendor/permissions-sections-final-patch.js',
  './src/rota/vendor/final-corrections-patch.js',
  './src/rota/vendor/final-top-nav-patch.js',
  './src/rota/vendor/final-admin-timesheets-report.js',
  './src/rota/vendor/final-admin-page-nav.js',
  './src/rota/vendor/final-render-on-load.js',
  './src/rota/vendor/absolute-final-fix.js',
  './src/rota/vendor/replacement-final.js',
  './src/rota/vendor/profile-save-final.js',
  './src/rota/vendor/visibility-and-card-final.js'
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