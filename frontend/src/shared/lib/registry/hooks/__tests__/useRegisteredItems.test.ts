import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createRegistryStore } from '../../registry.store'
import { useRegisteredItems } from '../useRegisteredItems'

interface Item {
  label: string
  order?: number
}

const makeStore = () => createRegistryStore<Item>()

describe('useRegisteredItems', () => {
  it('gives the items from the lowest order to the highest, with their ids', () => {
    const store = makeStore()
    act(() => {
      store.getState().setItem('x', { label: 'late', order: 5 })
      store.getState().setItem('y', { label: 'early', order: -1 })
      store.getState().setItem('z', { label: 'plain' })
    })

    const { result } = renderHook(() => useRegisteredItems(store))

    expect(result.current.map(({ key, label }) => [key, label])).toEqual([
      ['y', 'early'],
      ['z', 'plain'],
      ['x', 'late'],
    ])
  })

  it('keeps the order in which items of the same order came', () => {
    const store = makeStore()
    act(() => {
      store.getState().setItem('a', { label: 'a' })
      store.getState().setItem('b', { label: 'b' })
      store.getState().setItem('c', { label: 'c', order: 0 })
    })

    const { result } = renderHook(() => useRegisteredItems(store))

    expect(result.current.map(({ label }) => label)).toEqual(['a', 'b', 'c'])
  })

  it('follows the registry when an item leaves', () => {
    const store = makeStore()
    act(() => {
      store.getState().setItem('a', { label: 'a' })
      store.getState().setItem('b', { label: 'b' })
    })
    const { result } = renderHook(() => useRegisteredItems(store))

    act(() => {
      store.getState().removeItem('a')
    })

    expect(result.current.map(({ label }) => label)).toEqual(['b'])
  })
})
