// Service Worker – cacht nur die App-Hülle, niemals Google-API-Antworten.
const CACHE = "todo-shell-v12";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Google-Domains (APIs, Auth) immer direkt aus dem Netz – nie cachen.
  if (url.hostname.endsWith("googleapis.com") ||
      url.hostname.endsWith("google.com") ||
      url.hostname.endsWith("gstatic.com")) {
    return;
  }
  if (e.request.method !== "GET") return;
  // App-Hülle: erst Cache, dann Netz (und Cache aktualisieren).
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
