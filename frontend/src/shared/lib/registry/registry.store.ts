import { create } from 'zustand'

import type { RegistryState } from './registry.types'

/** A store for the items that components register while they are mounted. */
export function createRegistryStore<Item>() {
  return create<RegistryState<Item>>()((set) => ({
    items: new Map(),
    setItem: (source, item) => {
      set((state) => ({ items: new Map(state.items).set(source, item) }))
    },
    removeItem: (source) => {
      set((state) => {
        const items = new Map(state.items)
        items.delete(source)
        return { items }
      })
    },
  }))
}
