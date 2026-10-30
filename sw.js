
const CACHE_NAME = "new-pak-lab-v3";

const APP_FILES = [
  "./index-new.html",
  "./invoice.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of APP_FILES) {
        try {
          const response = await fetch(file);
          if (response.ok) {
            await cache.put(file, response);
          }
        } catch (error) {
          console.log("Cache nahi hui:", file);
        }
      }
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(async keys => {
      await Promise.all(
        keys
          .filter(key => key.startsWith("new-pak-lab-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
      await self.clients.claim();
    })
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(event.request, copy)
          );
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        if (event.request.mode === "navigate") {
          return (await caches.match("./index-new.html")) ||
            new Response("Offline page unavailable", { status: 503 });
        }

        return new Response("Offline: file cache mein nahi hai.", {
          status: 503
        });
      })
  );
});
