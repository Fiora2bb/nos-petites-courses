
const CACHE_NAME = "nos-petites-courses-v1";

const FICHIERS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", evenement => {
  evenement.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FICHIERS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", evenement => {
  evenement.waitUntil(
    caches.keys().then(noms => {
      return Promise.all(
        noms
          .filter(nom => nom !== CACHE_NAME)
          .map(nom => caches.delete(nom))
      );
    })
  );

  self.clients.claim();
});

self.addEventListener("fetch", evenement => {
  if (evenement.request.method !== "GET") return;

  evenement.respondWith(
    fetch(evenement.request).catch(() => {
      return caches.match(evenement.request);
    })
  );
});
