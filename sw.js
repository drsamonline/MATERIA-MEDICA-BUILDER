/* sw.js — offline cache for Materia Medica Builder. Bump CACHE to ship changes. */
const CACHE = "mmb-v3";
const ASSETS = [
  "./", "index.html", "manifest.json",
  "css/styles.css",
  "js/app.js", "js/db.js", "js/builders.js", "js/importers.js", "js/exporters.js", "js/docs.js", "js/tour.js",
  "icons/icon-192.svg", "icons/icon-512.svg", "icons/icon-192.png", "icons/icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
