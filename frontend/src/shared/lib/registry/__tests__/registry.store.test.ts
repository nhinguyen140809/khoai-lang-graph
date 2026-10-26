import { describe, expect, it } from 'vitest'

import { createRegistryStore } from '../registry.store'

describe('createRegistryStore', () => {
  const makeStore = () => createRegistryStore<string>()

  it('starts with no item', () => {
    expect(makeStore().getState().items.size).toBe(0)
  })

  it('keeps the item of each source, in the order the sources came', () => {
    const store = makeStore()

    store.getState().setItem('a', 'first')
    store.getState().setItem('b', 'second')
    store.getState().setItem('a', 'first again')

    expect([...store.getState().items]).toEqual([
      ['a', 'first again'],
      ['b', 'second'],
    ])
  })

  it('removes the item of a source', () => {
    const store = makeStore()
    store.getState().setItem('a', 'first')
    store.getState().setItem('b', 'second')

    store.getState().removeItem('a')

    expect([...store.getState().items]).toEqual([['b', 'second']])
  })
})
