// Service Worker para LDBAA PWA
const CACHE_NAME = 'ldbaa-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './vocalias.html',
  './pasion-argelia.html',
  './carnetizacion.html',
  './login.html',
  './ligabet.html',
  './dashboard.html',
  './css/index.css',
  './img/logo.png',
  './img/logomcv.png',
  './img/stadium-bg.png',
  './js/pwa-installer.js'
];

// Instalación: Cachear recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Algunos recursos no pudieron cachearse inicialmente:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de caches obsoletas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network First para Firestore / APIs / HTML, y Cache First / Stale While Revalidate para estáticos
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Ignorar llamadas a Firebase Firestore, Auth, APIs externas o peticiones no-GET
  if (
    event.request.method !== 'GET' ||
    requestUrl.origin.includes('firestore.googleapis.com') ||
    requestUrl.origin.includes('firebaseio.com') ||
    requestUrl.origin.includes('identitytoolkit') ||
    requestUrl.origin.includes('googleapis.com')
  ) {
    return;
  }

  // Para navegación HTML: Network First con fallback a caché
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Para otros assets estáticos: Stale-while-revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
