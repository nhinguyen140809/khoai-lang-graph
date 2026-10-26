

// The failures that come from the browser and not from the app: storage blocked or full.
const STORAGE_ERRORS = new Set(['SecurityError', 'QuotaExceededError'])

/**
 * The key of a value of the app in browser storage. Every key starts with the name of the app, so
 * that it never meets the keys of another app on the same origin.
 */
export function storageKey(name: string): string {
  return `khoailanggraph-${name}`
}

/**
 * Calls `run` with the localStorage, or returns `fallback` when there is none (server rendering) or
 * the browser refuses the call. Any other error is thrown, so a bug is not hidden.
 */
function withStorage<T>(fallback: T, run: (storage: Storage) => T): T {
  if (typeof window === 'undefined') return fallback
  try {
    return run(window.localStorage)
  } catch (error) {
    if (error instanceof DOMException && STORAGE_ERRORS.has(error.name)) return fallback
    throw error
  }
}

/**
 * The only module that reads and writes the localStorage of the browser (ESLint reports any other
 * use). It is for data the app can lose: sizes of the frame regions, open editor tabs, the
 * history of commands. Storage can be missing, blocked or full; then a read returns null and a
 * write is dropped, without a message, and the app works without the stored values. Data that
 * must not be lost does not go through it.
 */
export const browserStorage = {
  getItem(key: string): string | null {
    return withStorage(null, (storage) => storage.getItem(key))
  },
  setItem(key: string, value: string): void {
    withStorage(undefined, (storage) => {
      storage.setItem(key, value)
    })
  },
  removeItem(key: string): void {
    withStorage(undefined, (storage) => {
      storage.removeItem(key)
    })
  },
  /** The keys that start with `prefix`; none when the storage cannot be read. */
  keysStartingWith(prefix: string): string[] {
    return withStorage<string[]>([], (storage) =>
      Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
        (key): key is string => key?.startsWith(prefix) === true,
      ),
    )
  },
}
