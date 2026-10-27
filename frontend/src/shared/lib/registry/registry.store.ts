import { create } from 'zustand'

import { removeEntry, setEntry } from '@/shared/lib/collections'

import type { RegistryState } from './registry.types'

/** A store for the items that components register while they are mounted. */
export function createRegistryStore<Item>() {
  return create<RegistryState<Item>>()((set) => ({
    items: new Map(),
    setItem: (source, item) => {
      set((state) => ({ items: setEntry(state.items, source, item) }))
    },
    removeItem: (source) => {
      set((state) => ({ items: removeEntry(state.items, source) }))
    },
  }))
}
