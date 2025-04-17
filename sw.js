const CACHE_NAME = 'kantinho-delicia-cache-v1';
const urlsToCache = [
  '/', // Alias for index.html
  'INDEX.HTML',
  'manifest.json',
  'data.json',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'https://cdn.tailwindcss.com', // Tailwind CSS
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css', // Font Awesome CSS
  'https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;700&display=swap', // Google Fonts CSS
  // Note: Caching external scripts like React/Babel might be less effective if versions change, 
  // but included here for basic offline capability. Consider using local copies or more advanced caching.
  'https://unpkg.com/react@17/umd/react.development.js',
  'https://unpkg.com/react-dom@17/umd/react-dom.development.js',
  'https://unpkg.com/babel-standalone@6/babel.min.js',
  // Add web fonts used by Font Awesome if needed (often loaded by its CSS)
  // Example (might need adjustment based on actual font files loaded):
  // 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
];

// Install event: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Use addAll for atomic caching
        return cache.addAll(urlsToCache).catch(error => {
            console.error('Failed to cache one or more resources:', error);
            // Optionally, prevent the SW from installing if core assets fail
            // throw error;
        });
      })
  );
});

// Activate event: Clean up old caches (optional but recommended)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Serve from cache first, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch from network
        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic' && response.type !== 'cors') {
              return response;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cache the new response
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(error => {
            // Network request failed, and not in cache.
            // Optionally return a fallback offline page here.
            console.error('Fetch failed; returning offline fallback or error', error);
            // Example: return caches.match('/offline.html');
        });
      })
  );
}); 