// Service Worker for Improv Scoreboard
// Handles caching and offline functionality

const CACHE_NAME = 'improvscoreboard-v1.0.0';
const STATIC_CACHE_NAME = 'improvscoreboard-static-v1.0.0';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// Dynamic assets to cache on first load
const DYNAMIC_ASSETS = [
  '/locales/en/translation.json',
  '/locales/fr/translation.json',
  '/locales/en/scoreboardControl.json',
  '/locales/fr/scoreboardControl.json',
  '/locales/en/app.json',
  '/locales/fr/app.json',
  '/locales/en/scoreboardDisplay.json',
  '/locales/fr/scoreboardDisplay.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful API responses for 5 minutes
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              const cacheResponse = new Response(responseClone.body, {
                ...responseClone,
                headers: {
                  ...responseClone.headers,
                  'sw-cache-time': Date.now() + (5 * 60 * 1000) // 5 minutes
                }
              });
              cache.put(event.request, cacheResponse);
            });
          }
          return response;
        })
        .catch(() => {
          // Try to serve from cache if network fails
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              const cacheTime = cachedResponse.headers.get('sw-cache-time');
              if (cacheTime && Date.now() < parseInt(cacheTime)) {
                return cachedResponse;
              }
            }
            return new Response('Offline - API unavailable', { status: 503 });
          });
        })
    );
    return;
  }

  // Handle static assets and other resources
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/').then((response) => {
                return response || new Response('Offline - Please check your connection', {
                  status: 503,
                  statusText: 'Service Unavailable'
                });
              });
            }

            return new Response('Offline - Resource unavailable', { status: 503 });
          });
      })
  );
});

// Message event - handle updates from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});