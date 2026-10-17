import { create } from 'zustand'

import type { ActivityBarItem } from './activity.types'

interface ActivityBarState {
  /** The item of each component that registers one, in the order the components came. */
  items: ReadonlyMap<string, ActivityBarItem>
  setItem: (source: string, item: ActivityBarItem) => void
  removeItem: (source: string) => void
}

/** The items at the bottom of the activity bar. Components register theirs with `useActivityBarItem`. */
export const useActivityBarStore = create<ActivityBarState>()((set) => ({
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
