/* Qissati dashboard service worker.
 *
 * Push only: there is intentionally no fetch handler and no offline cache.
 * Dashboard responses contain orders and child details and already carry
 * `no-store`; a PWA must not quietly make durable offline copies of them.
 */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = {};
  }

  const title = payload.title || "قصتي";
  const options = {
    body: payload.body || "وصل طلب جديد.",
    icon: "/brand/logo-192.png",
    tag: payload.tag || "qissati-new-order",
    renotify: true,
    dir: "rtl",
    lang: "ar",
    data: { url: payload.url || "/admin" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/admin", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if ("navigate" in client) await client.navigate(targetUrl);
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
