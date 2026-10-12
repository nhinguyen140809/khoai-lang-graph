import type { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

/**
 * The only module that reads and writes the localStorage of the browser (ESLint reports any other
 * use). Everything kept there is device-local: sizes of the frame regions, open editor tabs.
 * Storage can be missing (server rendering, tests in Node.js), blocked, or full, so a read that
 * fails returns null and a write that fails is dropped; the app works without the stored values.
 */
export const browserStorage = {
  getItem(key: string): string | null {
    try {
      return window.localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      window.localStorage.setItem(key, value)
    } catch {
      // Not stored: the value is a convenience of this device.
    }
  },
  removeItem(key: string): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Nothing to remove.
    }
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
