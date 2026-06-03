const CACHE = "noco-mobile-1-2-ui-ai-v151";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./ux-v2.css",
  "./noco-chrome-fix.css",
  "./noco-pc-frame.css",
  "./noco-handset.css",
  "./noco-ui-polish.css",
  "./noco-liquid-exit.css",
  "./noco-island-ai.css",
  "./noco-icons.css",
  "./noco-library.css",
  "./noco-forge.css",
  "./noco-ai.css",
  "./noco-ai-app.css",
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
  "./noco-ai-router.js",
  "./noco-ai-understand.js",
  "./noco-ai-profile.js",
  "./noco-ai-live.js",
  "./noco-ai-games.js",
  "./noco-ai-pulse.js",
  "./noco-ai-meta.js",
  "./noco-ai-everyday.js",
  "./noco-ai-system.js",
  "./noco-ai-systemmap.js",
  "./noco-ai-diagnostics.js",
  "./noco-ai-chatcmd.js",
  "./noco-ai-answers.js",
  "./noco-ai-faq-bank.js",
  "./noco-ai-knowledge.js",
  "./noco-ai-actions.js",
  "./noco-ai-personality.js",
  "./noco-ai-smart.js",
  "./noco-ai-12.js",
  "./noco-ai-voice.js",
  "./noco-ai.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

function cacheOk(response) {
  return response && response.status === 200 && (response.type === "basic" || response.type === "default");
}

function stashInCache(request, response) {
  if (!cacheOk(response)) return;
  const clone = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, clone));
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      stashInCache(request, response);
      return response;
    })
    .catch(() => caches.match(request));
}

function isJsOrCss(request) {
  try {
    const path = new URL(request.url).pathname;
    return /\.(js|css)$/i.test(path);
  } catch (_) {
    return false;
  }
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

function isShellRequest(request) {
  if (request.method !== "GET") return false;
  try {
    const url = new URL(request.url);
    if (request.mode === "navigate") return true;
    return url.pathname.endsWith("/index.html") || url.pathname.endsWith("/");
  } catch (_) {
    return false;
  }
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isShellRequest(event.request) || isJsOrCss(event.request)) {
    event.respondWith(
      networkFirst(event.request).then(
        (response) => response || caches.match("./index.html")
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        stashInCache(event.request, response);
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
