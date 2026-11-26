/* Turnout: keeps a copy of the app and your clothes' photos on the phone,
   so it opens instantly and works on a bad signal. Checks GitHub for newer
   copies each time. The Apps Script and the weather are never cached. */
var C = "turnout-v2-0-1";
self.addEventListener("install", function (e) { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener("fetch", function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  var ours = u.origin === self.location.origin, fonts = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!ours && !fonts) return;
  e.respondWith(caches.open(C).then(function (c) {
    return c.match(e.request).then(function (hit) {
      var net = fetch(/\/img\//.test(u.pathname) || !ours ? e.request : new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" })).then(function (r) { if (r && r.redirected) r = new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers }); if (r && (r.ok || r.type === "opaque")) c.put(e.request, r.clone()); return r; }).catch(function () { return hit; });
      if (hit && /\/img\//.test(u.pathname)) return hit;          // photos rarely change
      if (hit) { e.waitUntil(net); return hit; }
      return net;
    });
  }));
});
/* The evening nudge: show it, and open Turnout on "Was it this?" when tapped */
self.addEventListener("push", function (e) {
  var d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.title || "What did you wear today?", {
    body: d.body || "Tap to log it. Ten seconds.", icon: "icon-192.png", badge: "icon-192.png", tag: "turnout-nudge",
    data: { url: "./?nudge=" + (d.date || "") }
  }));
});
self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ("focus" in cs[i]) { cs[i].postMessage({ nudge: 1 }); return cs[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});
