var CACHE = "piggy-v2";
var ASSETS = ["./", "./index.html", "./manifest.json", "./icons/icon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version, only falling
// back to the cache when offline. This keeps installed/home-screen
// copies in sync with what's deployed instead of serving a stale cache.
self.addEventListener("fetch", function (e) {
  e.respondWith(
    fetch(e.request).then(function (response) {
      if (response && response.status === 200 && response.type === "basic") {
        var clone = response.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
      }
      return response;
    }).catch(function () {
      return caches.match(e.request).then(function (cached) {
        return cached || caches.match("./index.html");
      });
    })
  );
});
