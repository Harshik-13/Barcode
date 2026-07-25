const CACHE = 'workspace-v1';
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) {
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, clone)); return res; }))
  );
});

self.addEventListener('push', (e) => {
  if (!e.data) return;

  try {
    const payload = e.data.json();
    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/favicon.svg',
      badge: payload.badge || '/favicon.svg',
      tag: payload.tag,
      data: payload.data,
      requireInteraction: payload.requireInteraction,
      actions: payload.actions,
      timestamp: payload.data?.timestamp || Date.now(),
      vibrate: [200, 100, 200],
    };

    e.waitUntil(self.registration.showNotification(payload.title, options));
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const data = e.notification.data;
  const action = e.action;
  let targetUrl = data?.url || '/';

  if (action && data?.actions) {
    const actionData = data.actions.find((a: { action: string }) => a.action === action);
    if (actionData?.url) {
      targetUrl = actionData.url;
    }
  }

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('notificationclose', (e) => {
  console.log('Notification closed:', e.notification.tag);
});