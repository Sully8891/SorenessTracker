// --- CHANGE: Increment Cache Version ---
const CACHE_NAME = 'muscle-soreness-tracker-cache-v2';

// List the files and resources to cache during installation
const urlsToCache = [
  '/', // Represents the root directory, often resolves to index.html
  '/index.html', // Explicitly cache index.html
  '/manifest.json', // Cache the manifest file itself

  // --- CHANGE: Add paths to your actual icon files ---
  // Make sure these paths match exactly where your icons are relative to sw.js
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Add any other icon sizes you included in the manifest here
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker V2: Installing...'); // Log version
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker V2: Caching app shell and icons');
        // Use { cache: 'reload' } to bypass HTTP cache during install
        const cachePromises = urlsToCache.map(urlToCache => {
            // Ensure we request the root '/' correctly if needed
            const requestUrl = urlToCache === '/' ? new Request(self.location.origin + '/', {cache: 'reload'}) : new Request(urlToCache, {cache: 'reload'});
            return cache.add(requestUrl).catch(err => console.error(`SW Cache add failed for ${urlToCache}:`, err));
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('Service Worker V2: Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
          console.error('Service Worker V2: Installation failed', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker V2: Activating...');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker V2: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker V2: Activation complete, claiming clients.');
        return self.clients.claim(); // Take control immediately
    })
  );
});


// Fetch event: Serve cached content when offline (Cache First strategy)
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
      return;
  }

  // console.log('Service Worker V2: Fetching', event.request.url); // Reduce logging noise
  event.respondWith(
    caches.match(event.request) // Check cache first
      .then(cachedResponse => {
        if (cachedResponse) {
          // console.log('Service Worker V2: Found in cache', event.request.url);
          return cachedResponse; // Return cached version
        }

        // console.log('Service Worker V2: Not found in cache, fetching from network', event.request.url);
        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once. We need two streams: one for the
        // cache and one for the browser to render.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                // Don't cache non-basic (cross-origin like CDN) or error responses
                return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            // Cache the fetched resource IF it's from our origin
            // (Avoid caching external resources like the Tailwind CDN here)
            if (event.request.url.startsWith(self.location.origin)) {
                caches.open(CACHE_NAME)
                  .then(cache => {
                    console.log('Service Worker V2: Caching new resource:', event.request.url);
                    cache.put(event.request, responseToCache);
                  });
            }

            return networkResponse;
        }).catch(error => {
            console.error('Service Worker V2: Fetch failed', error);
            // Optional: return an offline fallback page
            // return caches.match('/offline.html');
        });
      })
  );
});
