import { create } from 'zustand'

interface FollowedExportsState {
  /** The exports asked for in this page, until their file is ready or failed. */
  exportIds: readonly string[]
  follow: (exportId: string) => void
  forget: (exportId: string) => void
}

/** The exports that the page follows. They live in memory: a reload forgets them, not the server. */
export const useFollowedExportsStore = create<FollowedExportsState>()((set) => ({
  exportIds: [],
  follow: (exportId) => {
    set((state) =>
      state.exportIds.includes(exportId) ? state : { exportIds: [...state.exportIds, exportId] },
    )
  },
  forget: (exportId) => {
    set((state) => ({ exportIds: state.exportIds.filter((id) => id !== exportId) }))
  },
}))
