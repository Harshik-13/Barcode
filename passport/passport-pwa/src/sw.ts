// Very small service worker for offline caching (static assets)
const CACHE = 'passport-static-v1'
const ASSETS = ['/', '/index.html', '/src/main.tsx']

self.addEventListener('install', (e: any) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)))
})

self.addEventListener('fetch', (e: any) => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)))
})
