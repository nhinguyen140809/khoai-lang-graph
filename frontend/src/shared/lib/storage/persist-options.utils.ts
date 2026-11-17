import type { z } from 'zod'
import type { PersistOptions } from 'zustand/middleware'

import { storageKey } from './browser-storage.utils'
import { parseStored, persistStorage } from './persist-storage.utils'

interface BrowserPersistOptions<S, P> {
  /** The name of the store, which `storageKey` turns into its key in the storage. */
  name: string
  /** The schema of the part of the state that is stored, which checks it as it is read. */
  schema: z.ZodType<P>
  /** The part of the state that is stored. */
  partialize: (state: S) => P
  /** Whether the store has read its stored state: `(): boolean => useStore.persist.hasHydrated()`. */
  hasHydrated: () => boolean
}

/**
 * The options of `persist` for a zustand store kept in `browserStorage` and read after the first
 * render, so that the server HTML and the first client render use the defaults: the store reads it
 * with `useStore.persist.rehydrate()` in a layout effect. A change is stored only once the stored
 * state has been read, since a change made before would replace it unread. The stored part is
 * checked with `schema` as it is read, and dropped when it does not match.
 */
export function browserPersistOptions<S, P>({
  name,
  schema,
  partialize,
  hasHydrated,
}: BrowserPersistOptions<S, P>): PersistOptions<S, P> {
  return {
    name: storageKey(name),
    skipHydration: true,
    storage: persistStorage<P>({ ready: hasHydrated }),
    partialize,
    merge: (persisted, current) => ({ ...current, ...parseStored(schema, persisted) }),
  }
}
