import { create } from 'zustand'

import type { StatusBarItem } from './status-bar.types'

interface StatusBarState {
  /** The item of each component that registers one, in the order the components came. */
  items: ReadonlyMap<string, StatusBarItem>
  setItem: (source: string, item: StatusBarItem) => void
  removeItem: (source: string) => void
}

/** The items of the status bar. Components register theirs with `useStatusBarItem`. */
export const useStatusBarStore = create<StatusBarState>()((set) => ({
  items: new Map(),
  setItem: (source, item) => {
    // A source that is already there keeps its place.
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
