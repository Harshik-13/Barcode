// Minimal IndexedDB helper for demo purposes
export async function openDB(name = 'passport-db') {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('secrets')) db.createObjectStore('secrets', { keyPath: 'roll' })
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('activities')) db.createObjectStore('activities', { autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function storeSecret(entry: { roll: string; secret: string }) {
  const db = await openDB()
  return new Promise(resolve => {
    const tx = db.transaction('secrets', 'readwrite')
    tx.objectStore('secrets').put({ roll: entry.roll, secret: entry.secret })
    tx.oncomplete = () => resolve(true)
  })
}

export async function getSecret(roll: string) {
  const db = await openDB()
  return new Promise<any>(resolve => {
    const tx = db.transaction('secrets', 'readonly')
    const req = tx.objectStore('secrets').get(roll)
    req.onsuccess = () => resolve(req.result || { roll, secret: null })
    req.onerror = () => resolve({ roll, secret: null })
  })
}
