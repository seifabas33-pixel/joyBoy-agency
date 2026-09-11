/* Joy Boy team portal — background notifications.
   Registered by portal.js when a staff member turns reminders on. Messages are sent
   data-only from tools/sheets-sync.gs, so the wording and the link are decided here. */
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");
importScripts("./firebase-config.js");

firebase.initializeApp(self.JB_FIREBASE);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(p => {
  const d = (p && p.data) || {}, n = (p && p.notification) || {};
  const title = n.title || d.title || "Joy Boy";
  self.registration.showNotification(title, {
    body: n.body || d.body || "",
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: d.tag || undefined,                 // a newer message with the same tag replaces the old one
    renotify: !!d.tag,
    data: { url: d.url || "./" },
  });
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    for (const c of list) if (c.url.indexOf("/team/") >= 0 && "focus" in c) return c.focus();
    return clients.openWindow(url);
  }));
});
