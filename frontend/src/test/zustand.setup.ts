import { afterEach, vi } from 'vitest'
import type * as zustandModule from 'zustand'

// A store of zustand lives as long as its module, so a test would find what the test before it
// left in it. Each store that `create` makes is put back to its initial state after every test.
const resets = vi.hoisted(() => new Set<() => void>())

vi.mock('zustand', async (importOriginal) => {
  const actual = await importOriginal<typeof zustandModule>()

  function remember<Store extends { getInitialState: () => unknown; setState: unknown }>(
    store: Store,
  ) {
    resets.add(() => {
      ;(store.setState as (state: unknown, replace: true) => void)(store.getInitialState(), true)
    })
    return store
  }

  // `create(initializer)` and the curried `create<State>()(initializer)` that the app writes.
  const create = ((...args: [] | [never]) =>
    args.length === 0
      ? (curried: never) => remember(actual.create()(curried))
      : remember(actual.create(args[0]))) as typeof actual.create

  return { ...actual, create }
})

afterEach(() => {
  for (const reset of resets) reset()
})
