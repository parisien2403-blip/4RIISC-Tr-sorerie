// Service Worker — Les Phénix Trésorerie
// Stratégie : "network-first" pour la page (toujours la dernière version si connecté),
// avec repli sur le cache si hors ligne.
 
const CACHE_NAME = 'phenix-tresorerie-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];
 
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
});
 
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});
 
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if(req.method !== 'GET') return;
 
  // Page principale : toujours essayer le réseau en premier pour avoir la dernière version
  if(req.mode === 'navigate' || req.destination === 'document'){
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }
 
  // Icônes et autres fichiers statiques : cache d'abord, réseau en secours
  event.respondWith(
    caches.match(req).then((cached) => {
      if(cached) return cached;
      return fetch(req).then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        return res;
      }).catch(() => cached);
    })
  );
});
