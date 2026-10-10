// FORGED — offline support.
// Network first, so updates show up as soon as you're online; the cached copy
// is the fallback when you're not (e.g. a gym basement with no signal).
const CACHE = 'forged-v2.1.2';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css?v=2.1.2', 'js/motion.js?v=2.1.2', 'js/data.js?v=2.1.2', 'js/body.js?v=2.1.2', 'js/app.js?v=2.1.2',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('index.html')))
  );
});
