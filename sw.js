// ── Service Worker — Censos de Aves ──
const CACHE = 'censos-aves-1';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['./', './index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network first — siempre descarga la versión más reciente si hay conexión
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(res => {
        const copia = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copia));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
