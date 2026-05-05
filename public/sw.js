// TallerPro Service Worker v5.0
// Offline-first — cache everything on install
const CACHE_NAME = "tallerpro-v5.0.0";
const STATIC_ASSETS = ["/", "/index.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("fonts.googleapis.com") || event.request.url.includes("fonts.gstatic.com")) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => { cache.put(event.request, res.clone()); return res; });
        })
      )
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      if (res.ok && event.request.url.startsWith(self.location.origin)) {
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, res.clone()));
      }
      return res;
    }))
  );
});
