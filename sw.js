const CACHE_NAME = "hieli-pro-v2"; // ← cambia este número en cada deploy

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./sw.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting(); // Toma control inmediatamente
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME ? caches.delete(k) : null))
    )
  );
  self.clients.claim(); // Controla todas las pestañas abiertas
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  const isHTML = req.destination === "document" || url.pathname.endsWith(".html");

  if (isHTML) {
    // HTML → red primero, caché como fallback
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req) || caches.match("./"))
    );
  } else {
    // Otros archivos → caché primero, red como fallback
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        }).catch(() => caches.match("./"));
      })
    );
  }
});