// Busca sempre a versão nova quando tem internet; sem internet, usa a cópia guardada no celular.
const CACHE = 'financas-v1';
const FILES = ['./', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/money.js', './js/finance.js', './js/store.js', './js/voz.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  ev.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
