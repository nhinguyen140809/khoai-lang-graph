import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { browserStorage, storageKey } from '../browser-storage.utils'
import { browserPersistOptions } from '../persist-options.utils'

const KEY = storageKey('persist-options-test')

interface CounterState {
  count: number
  label: string
  setCount: (count: number) => void
}

/** A store kept in the browser that keeps its count and not its label. */
function createCounterStore() {
  const useStore = create<CounterState>()(
    persist(
      (set) => ({
        count: 0,
        label: 'counter',
        setCount: (count) => {
          set({ count })
        },
      }),
      browserPersistOptions({
        name: 'persist-options-test',
        schema: z.object({ count: z.number() }),
        partialize: ({ count }) => ({ count }),
        hasHydrated: (): boolean => useStore.persist.hasHydrated(),
      }),
    ),
  )
  return useStore
}

/** What the storage holds for the store, as JSON. */
function stored(): unknown {
  const value = browserStorage.getItem(KEY)
  return value === null ? null : JSON.parse(value)
}

afterEach(() => {
  browserStorage.removeItem(KEY)
})

describe('browserPersistOptions', () => {
  it('starts from the defaults and stores nothing before the stored state is read', () => {
    browserStorage.setItem(KEY, JSON.stringify({ state: { count: 4 } }))
    const useStore = createCounterStore()

    useStore.getState().setCount(9)

    expect(useStore.getState().count).toBe(9)
    expect(stored()).toEqual({ state: { count: 4 } })
  })

  it('reads the stored state, then stores the part it keeps at each change', async () => {
    browserStorage.setItem(KEY, JSON.stringify({ state: { count: 4 } }))
    const useStore = createCounterStore()

    await useStore.persist.rehydrate()
    expect(useStore.getState()).toMatchObject({ count: 4, label: 'counter' })
    useStore.getState().setCount(5)

    expect(stored()).toEqual({ state: { count: 5 }, version: 0 })
  })

  it('drops a stored state of another shape', async () => {
    browserStorage.setItem(KEY, JSON.stringify({ state: { count: 'four' } }))
    const useStore = createCounterStore()

    await useStore.persist.rehydrate()

    expect(useStore.getState().count).toBe(0)
  })
})
