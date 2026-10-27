import type { z } from 'zod'
import type { PersistStorage, StorageValue } from 'zustand/middleware'

import { browserStorage } from './browser-storage.utils'

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

interface EntryStorageOptions<S, E> extends PersistStorageOptions {
  /** The entries of the state, by name. An entry left out, such as an empty one, is removed. */
  split: (state: S) => Record<string, E>
  /** The state from the stored entries, by name, as parsed from JSON and not checked yet. */
  join: (entries: Record<string, unknown>) => S
}

/**
 * The storage of a persisted zustand store whose state divides into entries, such as the tabs of
 * each group. Each entry is kept as JSON under a key of its own, `<name>:<entry>`, and a write
 * stores only the entries that differ from what this page read or wrote last. Two browser tabs that
 * change different entries thus keep each other's changes; on the same entry, the last write wins.
 * An entry that is not valid JSON reads as nothing stored. The entries hold no version: `join`
 * checks them, and drops those of another shape.
 */
export function persistStorageByEntry<S, E>({
  split,
  join,
  ready = () => true,
}: EntryStorageOptions<S, E>): PersistStorage<S> {
  // By key, the JSON of each entry as this page read or wrote it last.
  const known = new Map<string, string>()
  const prefixOf = (name: string) => `${name}:`
  return {
    getItem: (name) => {
      const prefix = prefixOf(name)
      known.clear()
      const entries: Record<string, unknown> = {}
      for (const key of browserStorage.keysStartingWith(prefix)) {
        const stored = browserStorage.getItem(key)
        if (stored === null) continue
        known.set(key, stored)
        try {
          entries[key.slice(prefix.length)] = JSON.parse(stored)
        } catch {
          // Not JSON: the entry reads as nothing stored, and the next write removes it.
        }
      }
      return known.size === 0 ? null : { state: join(entries), version: 0 }
    },
    setItem: (name, value) => {
      if (!ready()) return
      const kept = new Set<string>()
      for (const [entry, entryValue] of Object.entries(split(value.state))) {
        const key = prefixOf(name) + entry
        const json = JSON.stringify(entryValue)
        kept.add(key)
        if (known.get(key) === json) continue
        browserStorage.setItem(key, json)
        known.set(key, json)
      }
      // Only the entries that this page knows: an entry that another browser tab added stays.
      for (const key of [...known.keys()]) {
        if (kept.has(key)) continue
        browserStorage.removeItem(key)
        known.delete(key)
      }
    },
    removeItem: (name) => {
      for (const key of browserStorage.keysStartingWith(prefixOf(name)))
        browserStorage.removeItem(key)
      known.clear()
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
