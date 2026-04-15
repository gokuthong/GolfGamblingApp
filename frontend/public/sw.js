// Service Worker for Golf Gamble Tracker
// Hybrid strategy: network-first with offline fallback from cache

const CACHE_NAME = "golf-gamble-v1";
const OFFLINE_URL = "/index.html";

// Assets to pre-cache for offline support
const PRE_CACHE_URLS = ["/index.html", "/favicon.svg"];

// Install: pre-cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch: network-first for navigation, cache-first for static assets
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip cross-origin requests (Firebase, Google Fonts, etc.)
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation requests: network-first, fallback to cached index.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh HTML
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL)),
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images): stale-while-revalidate
  if (
    request.url.match(
      /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/,
    )
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(request, clone));
            return response;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      }),
    );
    return;
  }
});
