import { browserStorage, storageKey } from '@/shared/lib/browser-storage.utils'

// Records that the mock server keeps between requests: the session, the user and the settings,
// and what POST requests create. The browser worker keeps them in browser storage, so that they
// survive a reload as data on a server would; unit tests keep them in memory only.

const KEY_PREFIX = storageKey('mock:')

let persistent = false
const memory = new Map<string, unknown>()
const keys = new Set<string>()

/** Keeps the records in browser storage; the browser worker setup calls it before it starts. */
export function keepMockDataInBrowser() {
  persistent = true
}

/** Forgets every record, so that the next request sees the fixtures again. */
export function resetMockData() {
  memory.clear()
  for (const key of keys) browserStorage.removeItem(key)
}

export interface MockRecord<T> {
  get: () => T
  set: (value: T) => void
}

/** One record of the mock server, starting from `initial` until it is set. */
export function mockRecord<T>(name: string, initial: () => T): MockRecord<T> {
  const key = `${KEY_PREFIX}${name}`
  keys.add(key)
  return {
    get() {
      if (memory.has(key)) return memory.get(key) as T
      let value = initial()
      const stored = persistent ? browserStorage.getItem(key) : null
      if (stored !== null) {
        try {
          value = JSON.parse(stored) as T
        } catch {
          // Unreadable: start from the fixtures.
        }
      }
      memory.set(key, value)
      return value
    },
    set(value) {
      memory.set(key, value)
      if (persistent) browserStorage.setItem(key, JSON.stringify(value))
    },
  }
}
