// ── Service Worker — Censos de Aves ──
const CACHE = 'censos-aves-2'; // incrementado para forzar reinstalación

const ARCHIVOS = [
  './',
  './index.html',
  './ortofoto_navaza.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ARCHIVOS))
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

// El HTML usa network-first (siempre actualizado)
// La ortofoto usa cache-first (no cambia, ahorra datos)
self.addEventListener('fetch', e => {
  if (!e.request.url.startsWith(self.location.origin)) return;

  const isImage = e.request.url.endsWith('.jpg') || e.request.url.endsWith('.jpeg');

  if (isImage) {
    // Cache first para la ortofoto — una vez descargada, no se vuelve a pedir
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copia));
          return res;
        });
      })
    );
  } else {
    // Network first para el HTML — siempre la versión más reciente
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          const copia = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copia));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  }
});
