/* Turnout: keeps a copy of the app and your clothes' photos on the phone,
   so it opens instantly and works on a bad signal. Checks GitHub for newer
   copies each time. The Apps Script and the weather are never cached. */
var C = "turnout-v1-9-15";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  var ours = u.origin === self.location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!ours && !fonts) return;
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (r) { if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      if (hit && /\/img\//.test(u.pathname)) return hit;          // photos rarely change
      if (hit) { e.waitUntil(net); return hit; }
      return net;
    });
  }));
});
