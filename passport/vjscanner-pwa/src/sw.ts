// Enhanced PWA service worker with caching strategies
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `scanner-static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `scanner-dynamic-${CACHE_VERSION}`
const IMAGE_CACHE = `scanner-images-${CACHE_VERSION}`

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
]

// Install event - cache static assets
self.addEventListener('install', (e: any) => {
  console.log('[SW] Installing service worker...')
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Failed to cache some assets:', err)
        // Cache what we can, don't fail installation
        return Promise.resolve()
      })
    }).then(() => {
      console.log('[SW] Service worker installed')
      return (self as any).skipWaiting()
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (e: any) => {
  console.log('[SW] Activating service worker...')
  e.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('scanner-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== IMAGE_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    }).then(() => {
      console.log('[SW] Service worker activated')
      return (self as any).clients.claim()
    })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (e: any) => {
  const { request } = e
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // API calls - Network First (with fallback to cache)
  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then(cached => {
            return cached || new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            })
          })
        })
    )
    return
  }

  // Images - Cache First (with network fallback)
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(IMAGE_CACHE).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
      })
    )
    return
  }

  // Static assets (JS, CSS, fonts) - Cache First
  if (url.pathname.match(/\.(js|css|woff2?|ttf|eot)$/)) {
    e.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(request, responseClone)
            })
          }
          return response
        }).catch(() => {
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html')
          }
          return new Response('Offline', { status: 503 })
        })
      })
    )
    return
  }

  // HTML pages - Network First (with cache fallback)
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone)
          })
          return response
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            return cached || caches.match('/index.html')
          })
        })
    )
    return
  }

  // Default - Network First
  e.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone()
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone)
          })
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})

// Background Sync handlers
self.addEventListener('sync', (event: any) => {
  if (!event.tag) return
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncLogs())
  }
  if (event.tag === 'sync-keys') {
    event.waitUntil(syncKeys())
  }
})

async function openDB(name = 'scanner-db') {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys', { keyPath: 'roll' })
      if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error as any)
  })
}

async function getUnsyncedLogs() {
  const db = await openDB()
  return new Promise<any[]>((resolve) => {
    const tx = db.transaction('logs', 'readonly')
    const req = tx.objectStore('logs').getAll()
    req.onsuccess = () => resolve((req.result || []).filter((l: any) => !l.synced))
    req.onerror = () => resolve([])
  })
}

async function markAllLogsSynced() {
  const db = await openDB()
  return new Promise((resolve) => {
    const tx = db.transaction('logs', 'readwrite')
    const store = tx.objectStore('logs')
    const getAll = store.getAll()
    getAll.onsuccess = () => {
      const items = (getAll.result || [])
      items.forEach((it: any) => store.put({ ...it, synced: true }))
    }
    tx.oncomplete = () => resolve(true)
  })
}

async function syncLogs() {
  try {
    const logs = await getUnsyncedLogs()
    if (!logs.length) return
    const base = (self as any).location.origin.replace(/\/$/, '')
    await fetch(`${base.replace(/:\d+$/, ':8080')}/api/sync/logs`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ logs })
    })
    await markAllLogsSynced()
  } catch {}
}

async function syncKeys() {
  // requires hostelId; in real app we'd read meta store
}
