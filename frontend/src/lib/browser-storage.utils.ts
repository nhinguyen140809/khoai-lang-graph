import type { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

// The failures that come from the browser and not from the app: storage blocked or full.
const STORAGE_ERRORS = new Set(['SecurityError', 'QuotaExceededError'])

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
}

interface PersistStorageOptions {
  /**
   * Writes are dropped until it returns true. A store that reads its stored state after the first
   * render (`skipHydration`) passes `(): boolean => useStore.persist.hasHydrated()`: the persist
   * middleware writes on every change, and a change made before the stored state is read would
   * replace it unread.
   */
  ready?: () => boolean
}

/**
 * The storage of a persisted zustand store, kept in `browserStorage` as JSON. A stored value that
 * is not valid JSON reads as nothing stored, so reading never fails: zustand marks a store as
 * hydrated only after a read that succeeds, and a store left unhydrated would drop its writes for
 * good. The store starts from its defaults, and its next write replaces the value.
 */
export function persistStorage<S>({
  ready = () => true,
}: PersistStorageOptions = {}): PersistStorage<S> {
  return {
    getItem: (name) => {
      const stored = browserStorage.getItem(name)
      if (stored === null) return null
      try {
        return JSON.parse(stored) as StorageValue<S>
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      if (ready()) browserStorage.setItem(name, JSON.stringify(value))
    },
    removeItem: (name) => {
      browserStorage.removeItem(name)
    },
  }
}

/**
 * The stored state of a persisted store, checked with `schema` before it is used: a value written
 * by an older version of the app, or changed by hand, is dropped instead of breaking the store.
 */
export function parseStored<T>(schema: z.ZodType<T>, stored: unknown): T | undefined {
  const result = schema.safeParse(stored)
  return result.success ? result.data : undefined
}
