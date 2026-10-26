import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createRegistryStore } from '../../registry.store'
import { useRegisterItem } from '../useRegisterItem'

interface Item {
  label: string
  order?: number
}

const makeStore = () => createRegistryStore<Item>()
const labels = (store: ReturnType<typeof makeStore>) =>
  [...store.getState().items.values()].map(({ label }) => label)

describe('useRegisterItem', () => {
  it('registers the item while the component is mounted, and removes it on unmount', () => {
    const store = makeStore()

    const view = renderHook(() => {
      useRegisterItem(store, { label: 'one' })
    })
    expect(labels(store)).toEqual(['one'])

    view.unmount()
    expect(labels(store)).toEqual([])
  })

  it('replaces the item of the component when the item changes, keeping its place', () => {
    const store = makeStore()
    const first = { label: 'first' }
    const second = { label: 'second' }
    const view = renderHook(
      ({ item }) => {
        useRegisterItem(store, item)
      },
      { initialProps: { item: first } },
    )
    renderHook(() => {
      useRegisterItem(store, { label: 'other' })
    })

    view.rerender({ item: second })

    expect(labels(store)).toEqual(['second', 'other'])
  })

  it('keeps one item for each component', () => {
    const store = makeStore()

    renderHook(() => {
      useRegisterItem(store, { label: 'a' })
      useRegisterItem(store, { label: 'b' })
    })

    expect(labels(store)).toEqual(['a', 'b'])
  })
})
