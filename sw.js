const CACHE = "noco-mobile-1-2-ui-ai-v167";

function cacheOk(response) {
  return response && response.status === 200 && (response.type === "basic" || response.type === "default");
}

function stashInCache(request, response) {
  if (!cacheOk(response)) return;
  const clone = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, clone));
}

/** Immer zuerst Netzwerk — wichtig fuer GitHub Pages nach Upload. */
function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      stashInCache(request, response);
      return response;
    })
    .catch(() => caches.match(request));
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});
