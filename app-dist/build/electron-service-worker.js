// Modified service worker for Electron environment
// This version doesn't use caching for file:// URLs

const CACHE_NAME = 'invoicing-genius-cache-v1';

// Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('Electron Service Worker installed');
  self.skipWaiting();
});

// Claim clients to take control immediately
self.addEventListener('activate', (event) => {
  console.log('Electron Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle fetch events without caching for file:// URLs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For file:// URLs, just fetch without caching
  if (url.protocol === 'file:') {
    console.log('Fetching file:// URL without caching:', url.pathname);
    return;
  }
  
  // For http(s) URLs, use caching
  if (url.protocol === 'http:' || url.protocol === 'https:') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Return cached response if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        
        // Otherwise fetch from network and cache
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response to cache it and return it
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch((error) => {
          console.error('Fetch failed:', error);
          // You could return a custom offline page here
        });
      })
    );
  }
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
