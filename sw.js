const CACHE = "fupantai-shell-v1";
const FILES = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith("fupantai-shell-") && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match("./");
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          await cache.put("./", response.clone());
          return response;
        }
        return saved || response;
      } catch (error) {
        if (saved) return saved;
        return new Response("请先联网打开一次复盘台，再使用离线记录。", {
          status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      }
    })());
  } else if (FILES.slice(1).some(file => new URL(file, self.registration.scope).pathname === url.pathname)) {
    event.respondWith(caches.match(event.request).then(saved => saved || fetch(event.request)));
  }
});
