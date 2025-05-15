
// Cache name has a version - when you need to invalidate the cache, update the version number
const CACHE_NAME = 'invoicing-genius-v2';

// List of URLs to cache for offline use
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './offline.html',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // Add CSS and JS files that are generated during build
  // These paths will match what Vite produces
  './assets/index-*.css',
  './assets/index-*.js'
];

// Install the service worker and cache the static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Activate the new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
  );
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
});

// Network-first strategy for API requests
const apiStrategy = async (request) => {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // If successful, clone and cache the response
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, try from cache
    const cachedResponse = await caches.match(request);
    return cachedResponse || Promise.reject('No network and no cache');
  }
};

// Cache-first strategy for static assets
const cacheFirstStrategy = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache the fetched response
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // No cache and no network
    if (request.destination === 'document') {
      return caches.match('./offline.html');
    }
    
    return Promise.reject('No network and no cache');
  }
};

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // For API requests, use network-first strategy
  if (url.pathname.includes('./rest/v1') || url.pathname.includes('./auth/v1')) {
    event.respondWith(apiStrategy(event.request));
    return;
  }
  
  // For navigation requests, special handling
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('./offline.html') || caches.match('./');
      })
    );
    return;
  }
  
  // For all other requests, use cache-first strategy
  event.respondWith(cacheFirstStrategy(event.request));
});

// Listen for the "skipWaiting" message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic sync for background data updates when online
self.addEventListener('periodicsync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Function to sync data when connection is restored
async function syncData() {
  // This would typically retrieve pending offline changes and sync them
  console.log('Background sync started');
  // Implementation would depend on your specific offline data requirements
}
