import { create } from 'zustand'

/**
 * How far the scrollers of the pages were scrolled, for the session only, by the address of the
 * page and a name. A page that is dropped when too many are kept hidden finds its scroller as the
 * reader left it when it is visited again.
 */
interface ScrollMemoryState {
  scrolls: Readonly<Record<string, number>>
  rememberScroll: (key: string, offset: number) => void
}

export const useScrollMemoryStore = create<ScrollMemoryState>()((set) => ({
  scrolls: {},
  rememberScroll: (key, offset) => {
    set((state) => ({ scrolls: { ...state.scrolls, [key]: offset } }))
  },
}))
