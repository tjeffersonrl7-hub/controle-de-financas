// Guarda os arquivos do app no celular pra abrir mesmo sem internet.
const CACHE = 'financas-v1';
const FILES = ['./', './index.html', './styles.css', './manifest.webmanifest',
  './js/app.js', './js/money.js', './js/finance.js', './js/store.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', ev => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(caches.match(ev.request, { ignoreSearch: true }).then(hit => hit || fetch(ev.request)));
});
