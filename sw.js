const CACHE = 'compliance-bible-blank-demo-firebase-v20260624-1';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
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

function notificationPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch (_) {
    return { title: 'Pub Compliance Hub', body: event.data.text() };
  }
}

self.addEventListener('push', event => {
  const payload = notificationPayload(event);
  const title = payload.title || 'Pub Compliance Hub';
  const options = {
    body: payload.body || 'You have a new notification.',
    tag: payload.tag || payload.type || 'compliance-notification',
    renotify: true,
    data: {
      url: payload.url || './index.html',
      route: payload.route || '',
      type: payload.type || '',
      weekStart: payload.weekStart || ''
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  let url = data.url || './index.html';
  if (data.route && url.indexOf('route=') === -1) {
    url = './index.html?route=' + encodeURIComponent(data.route);
  }
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if ('navigate' in client) return client.navigate(url).then(navigated => (navigated || client).focus());
          if ('focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(url);
        return undefined;
      })
  );
});
