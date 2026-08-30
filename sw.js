const CACHE_NAME = 'dilek-kavanozu-v7';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Her dosyayı ayrı ayrı önbelleğe al: biri başarısız olsa bile
      // (örn. eksik/yanlış isimli bir ikon) diğerleri kaydedilmeye devam eder.
      return Promise.all(
        urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.warn('Önbelleğe alınamadı, atlanıyor:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      const networkFetch = fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && event.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Ağ yoksa ve bu bir sayfa isteğiyse, önbellekteki index.html'i döndür
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return cached;
        });
      return cached || networkFetch;
    })
  );
});
