const CACHE_PREFIX = 'compliance-bible-';
const CACHE = CACHE_PREFIX + 'chip-in-shell-v1';

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const entry = new URL('index.html', self.registration.scope);
    const response = await fetch(entry, {cache: 'reload'});
    if (!response.ok) throw new Error('Unable to cache the application shell');
    const html = await response.clone().text();
    const urls = [...html.matchAll(/<(?:script|link)\b[^>]+(?:src|href)="([^"]+)"/g)]
      .map(match => new URL(match[1], entry))
      .filter(url => url.origin === entry.origin && url.href.startsWith(self.registration.scope));
    const cache = await caches.open(CACHE);
    await cache.addAll([...new Set(urls.map(url => url.href).concat([
      new URL('assets/chip-in.png', entry).href,
      new URL('assets/chip-in-mark.svg', entry).href
    ]))]);
    await cache.put(entry, response);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    try {
      return await fetch(request);
    } catch (error) {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === 'navigate' && request.url === self.registration.scope) {
        const entry = await cache.match(new URL('index.html', self.registration.scope));
        if (entry) return entry;
      }
      throw error;
    }
  })());
});
