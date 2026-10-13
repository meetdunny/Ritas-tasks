/* Rita's Task Manager service worker: keeps the app shell available offline.
   Task data is never cached here; it only ever travels between the page and the Google Sheet. */
const CACHE = 'rtm-shell-v7';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png',
  'ill_home_hero.webp', 'ill_all_done.webp', 'ill_card_meeting.webp', 'ill_card_planning.webp', 'ill_empty_today.webp', 'ill_empty_tasks.webp',
  'ill_empty_calendar.webp', 'ill_empty_time.webp', 'ill_sign_off.webp', 'ill_offline.webp'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // leave Google and font requests alone
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then((res) => {   // always ask the server, never a stale browser copy                      // fresh copy first, so updates show as soon as you upload them
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html')))
  );
});

/* tapping a deadline alert brings the app to the front, or opens it */
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
