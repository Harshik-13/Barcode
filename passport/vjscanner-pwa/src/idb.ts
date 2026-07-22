// Basic IndexedDB wrapper for scanner app
export async function openDB(name = 'scanner-db') {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('keys')) db.createObjectStore('keys', { keyPath: 'roll' })
      if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function storeKeys(bundle: any[]) {
  const db = await openDB()
  return new Promise(resolve => {
    const tx = db.transaction('keys', 'readwrite')
    const store = tx.objectStore('keys')
    bundle.forEach(k => store.put(k))
    tx.oncomplete = () => resolve(true)
  })
}

export async function getKey(roll: string) {
  const db = await openDB()
  return new Promise<any>(resolve => {
    const tx = db.transaction('keys', 'readonly')
    const req = tx.objectStore('keys').get(roll)
    req.onsuccess = () => resolve(req.result || null)
    req.onerror = () => resolve(null)
  })
}

export async function storeScanLog(log: any) {
  const db = await openDB()
  return new Promise(resolve => {
    const tx = db.transaction('logs', 'readwrite')
    tx.objectStore('logs').add({ ...log, synced: false })
    tx.oncomplete = () => resolve(true)
  })
}

export async function getUnsyncedLogs() {
  const db = await openDB()
  return new Promise<any[]>(resolve => {
    const tx = db.transaction('logs', 'readonly')
    const req = tx.objectStore('logs').getAll()
    req.onsuccess = () => resolve((req.result || []).filter((l: any) => !l.synced))
    req.onerror = () => resolve([])
  })
}

export async function markAllLogsSynced() {
  const db = await openDB()
  return new Promise(resolve => {
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

// New: return unsynced VALID logs including their auto-incremented keys
export async function getUnsyncedValidLogs(): Promise<Array<{ id: number, log: any }>> {
  const db = await openDB()
  return new Promise(resolve => {
    const out: Array<{ id: number, log: any }> = []
    const tx = db.transaction('logs', 'readonly')
    const store = tx.objectStore('logs')
    const cursorReq = store.openCursor()
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result as IDBCursorWithValue | null
      if (cursor) {
        const val: any = cursor.value
        if (!val.synced && val?.status === 'valid') {
          out.push({ id: Number(cursor.key), log: val })
        }
        cursor.continue()
      } else {
        resolve(out)
      }
    }
    cursorReq.onerror = () => resolve([])
  })
}

// New: mark specific logs as synced by their keys (delta marking)
export async function markLogsSyncedByIds(ids: number[]) {
  if (!ids?.length) return
  const db = await openDB()
  return new Promise(resolve => {
    const tx = db.transaction('logs', 'readwrite')
    const store = tx.objectStore('logs')
    let remaining = ids.length
    ids.forEach(id => {
      const getReq = store.get(id)
      getReq.onsuccess = () => {
        const val = getReq.result
        if (val) store.put({ ...val, synced: true }, id)
        if (--remaining === 0) resolve(true)
      }
      getReq.onerror = () => {
        if (--remaining === 0) resolve(true)
      }
    })
  })
}
