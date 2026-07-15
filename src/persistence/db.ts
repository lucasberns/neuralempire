// IndexedDB key-value mínimo. ponytail: sem lib (idb/dexie) — fase 0 só precisa de get/put.
const DB_NAME = 'neural-empire'
const STORE = 'kv'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Falha ao abrir o IndexedDB'))
  })
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDb()
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result as T)
      req.onerror = () => reject(req.error ?? new Error('Operação no IndexedDB falhou'))
    })
  } finally {
    db.close()
  }
}

export const kvGet = <T>(key: string): Promise<T | undefined> =>
  withStore<T | undefined>('readonly', (s) => s.get(key))

export const kvSet = (key: string, value: unknown): Promise<void> =>
  withStore<IDBValidKey>('readwrite', (s) => s.put(value, key)).then(() => undefined)
