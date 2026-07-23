import { submitScan, type ScanResult } from './scanService';

interface QueuedScan {
  id: string;
  barcode: string;
  scannedAt: string;
  retryCount: number;
}

const DB_NAME = 'workspace-offline-queue';
const STORE_NAME = 'scans';
const MAX_RETRIES = 5;

function openDb(): Promise<IDBObjectStore> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    req.onsuccess = () => {
      const tx = req.result.transaction(STORE_NAME, 'readwrite');
      resolve(tx.objectStore(STORE_NAME));
    };
    req.onerror = () => reject(req.error);
  });
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function enqueueScan(barcode: string): Promise<void> {
  const store = await openDb();
  store.add({ id: generateId(), barcode, scannedAt: new Date().toISOString(), retryCount: 0 });
}

export async function getQueueSize(): Promise<number> {
  try {
    const store = await openDb();
    return new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}

export async function processQueue(onResult?: (result: ScanResult) => void): Promise<void> {
  const store = await openDb();
  const all: QueuedScan[] = await new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of all) {
    if (item.retryCount >= MAX_RETRIES) {
      store.delete(item.id);
      continue;
    }

    const result = await submitScan(item.barcode);
    if (result.success) {
      store.delete(item.id);
    } else {
      item.retryCount++;
      store.put(item);
    }

    onResult?.(result);
  }
}

export async function clearQueue(): Promise<void> {
  const store = await openDb();
  store.clear();
}
