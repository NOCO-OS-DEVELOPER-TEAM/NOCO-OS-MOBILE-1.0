const CACHE = "noco-mobile-1-2-ui-ai-v101";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./ux-v2.css",
  "./noco-icons.css",
  "./noco-library.css",
  "./noco-ai.css",
  "./noco-exclusive.css",
  "./noco-reminders.css",
  "./noco-reminders.js",
  "./noco-home-edit.css",
  "./noco-device.css",
  "./noco-device.js",
  "./noco-ai-chats.js",
  "./noco-notes.js",
  "./noco-ai-math.js",
  "./noco-ai-create.js",
  "./noco-ai-insights.js",
  "./noco-ai-pro.js",
  "./noco-ai-time.js",
  "./noco-ai-ultra.js",
  "./noco-ai-natural.js",
  "./noco-ai-intent.js",
  "./noco-ai-lexicon.js",
  "./noco-ai-limits.js",
  "./noco-ai-brain.js",
  "./noco-ai-system.js",
  "./noco-ai.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

function cacheOk(response) {
  return response && response.status === 200 && (response.type === "basic" || response.type === "default");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(ASSETS.map((url) => cache.add(url)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (cacheOk(response)) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return caches.match("./index.html");
        })
      )
  );
});
