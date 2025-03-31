// Define a cache name, including a version number
const CACHE_NAME = 'muscle-soreness-tracker-cache-v1';

// List the files and resources to cache during installation
// This should include the main HTML file and potentially CSS/JS if they were external
// Since CSS/JS are inline or loaded from CDN in this example, caching index.html is key.
// Add other essential assets if you have them (like actual icon files).
const urlsToCache = [
  '/', // Represents the root directory, often resolves to index.html
  '/index.html', // Explicitly cache index.html
  // Add paths to your actual icon files here if you want them cached:
  // '/icons/icon-192.png',
  // '/icons/icon-512.png',
  // Note: The Tailwind CSS is loaded from a CDN, service workers typically don't cache cross-origin resources by default easily.
  // For full offline Tailwind, you'd need to download it and serve it locally.
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        // Activate the new service worker immediately
        return self.skipWaiting();
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache version
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation complete, claiming clients.');
        // Take control of currently open pages
        return self.clients.claim();
    })
  );
});


// Fetch event: Serve cached content when offline
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  event.respondWith(
    // Try to find the response in the cache
    caches.match(event.request)
      .then(response => {
        // Return response from cache if found
        if (response) {
          console.log('Service Worker: Found in cache', event.request.url);
          return response;
        }

        // If not found in cache, try to fetch from the network
        console.log('Service Worker: Not found in cache, fetching from network', event.request.url);
        return fetch(event.request)
                .then(networkResponse => {
                    // Optional: Cache the newly fetched resource if needed (be careful with dynamic content)
                    // For this simple app, we primarily rely on the install-time cache.
                    return networkResponse;
                })
                .catch(error => {
                    // Handle network errors (e.g., show an offline page)
                    // For this basic example, just log the error.
                    console.error('Service Worker: Fetch failed; returning offline fallback or error for', event.request.url, error);
                    // You could return a generic offline response here if needed:
                    // return new Response("You are offline.", { status: 503, statusText: "Service Unavailable" });
                });
      })
  );
});
```
* This service worker caches the `index.html` file when it's first installed.
* When the browser requests a file, the service worker first checks the cache. If it's found, it serves the cached version (making it work offline). If not, it tries to fetch it from the network.
* It also includes logic to clean up old caches when the service worker version chang
