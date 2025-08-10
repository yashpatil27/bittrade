const CACHE_NAME = 'bittrade-v1';
const RUNTIME_CACHE = 'bittrade-runtime-v1';

// Critical app shell assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/bitcoin-logo-2-black-bg.svg',
  '/bitcoin-logo-2.svg',
  '/logo192.png',
  '/logo512.png',
  '/apple-touch-icon.png'
];

// Install event - cache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.warn('[SW] Pre-cache failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Delete old versions of our cache
            return cacheName.startsWith('bittrade-') && 
                   cacheName !== CACHE_NAME && 
                   cacheName !== RUNTIME_CACHE;
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests and non-GET requests
  if (url.origin !== location.origin || request.method !== 'GET') {
    return;
  }

  // Skip development server assets and HMR requests
  if (url.port === '3000' || // Development server
      url.pathname.includes('webpack') || // Webpack assets
      url.pathname.includes('hot-update') || // HMR updates
      url.searchParams.has('webpack') || // Webpack queries
      url.pathname.includes('sockjs-node') || // Dev server websockets
      url.pathname.includes('__webpack_dev_server__')) { // Dev server assets
    return;
  }

  // Handle API requests - always go to network for fresh data
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/socket.io/') ||
      url.searchParams.has('_t')) { // Skip timestamped requests
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // If we have a cached version, serve it immediately
      if (cachedResponse) {
        // For HTML files, also check network in background to update cache
        if (request.destination === 'document') {
          updateCacheInBackground(request);
        }
        return cachedResponse;
      }

      // No cached version, fetch from network
      return fetch(request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache successful responses for static assets and pages
        if (shouldCache(request)) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }

        return response;
      }).catch(() => {
        // Network failed, try to serve offline fallback for HTML requests
        if (request.destination === 'document') {
          return caches.match('/');
        }
        throw new Error('Network failed and no cache available');
      });
    })
  );
});

// Background cache update for HTML files
function updateCacheInBackground(request) {
  fetch(request).then(response => {
    if (response && response.status === 200 && response.type === 'basic') {
      caches.open(RUNTIME_CACHE).then(cache => {
        cache.put(request, response);
      });
    }
  }).catch(() => {
    // Ignore network errors in background updates
  });
}

// Determine if a request should be cached
function shouldCache(request) {
  const url = new URL(request.url);
  
  // Cache static assets (JS, CSS, images)
  if (request.destination === 'script' || 
      request.destination === 'style' || 
      request.destination === 'image' ||
      request.destination === 'font') {
    return true;
  }

  // Cache HTML pages (but not API endpoints)
  if (request.destination === 'document' && 
      !url.pathname.startsWith('/api/')) {
    return true;
  }

  // Cache manifest and other PWA assets
  if (url.pathname.endsWith('.json') && 
      url.pathname.includes('manifest')) {
    return true;
  }

  return false;
}

// Handle background sync for offline actions (future enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    // Could be used for queuing failed transactions when offline
  }
});

// Log service worker status
console.log('[SW] BitTrade Service Worker loaded');
