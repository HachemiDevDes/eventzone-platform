// Eventzone Offline Service Worker
const CACHE_NAME = "eventzone-offline-v2";

const CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/favicon.png",
  "/icon.png",
  "/apple-icon.png"
];

// Install: Cache core application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn("[Eventzone SW] Core assets caching warning:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Eventzone SW] Deleting obsolete cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy for navigation, static assets, and API requests
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // 1. Navigation requests (HTML page loads / browser refresh)
  const isNavigation = request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Cache both the full URL and the base root shell
              cache.put(request, responseClone);
              cache.put("/", networkResponse.clone());
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline navigation fallback: try matching requested URL, then fallback to root SPA shell
          const cachedExact = await caches.match(request);
          if (cachedExact) return cachedExact;

          const cachedRoot = await caches.match("/");
          if (cachedRoot) return cachedRoot;

          return new Response(
            "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Eventzone Offline</title></head><body style='font-family:sans-serif;padding:40px;text-align:center;'><h2>Eventzone is working offline</h2><p>Please wait while reconnecting...</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // 2. Next.js static assets, scripts, stylesheets, fonts, and images (Cache-First / Stale-While-Revalidate)
  const isStaticAsset = 
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/image") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => null);

        // If in cache, return immediately; revalidate in background. Otherwise wait for network.
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. API requests: Network-First (offline fallback handled by client offline queue)
  event.respondWith(
    fetch(request).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      return new Response(JSON.stringify({ error: "Offline - network unavailable", offline: true }), {
        status: 503,
        statusText: "Service Unavailable (Offline)",
        headers: { "Content-Type": "application/json" }
      });
    })
  );
});
