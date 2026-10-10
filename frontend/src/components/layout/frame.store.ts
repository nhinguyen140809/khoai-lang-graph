import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorage } from '@/lib/browser-storage.utils'

export const SIDE_PANEL_DEFAULT_WIDTH = 260
export const BOTTOM_PANEL_DEFAULT_HEIGHT = 240

const persistedFrameSchema = z.object({
  sidePanelVisible: z.boolean(),
  /** Width of the side panel in pixels; it keeps its width when the window is resized. */
  sidePanelWidth: z.number().positive(),
  bottomPanelVisible: z.boolean(),
  /** Height of the panel under the editor in pixels. */
  bottomPanelHeight: z.number().positive(),
})

type PersistedFrame = z.infer<typeof persistedFrameSchema>

interface FrameState extends PersistedFrame {
  toggleSidePanel: () => void
  setSidePanelVisible: (visible: boolean) => void
  setSidePanelWidth: (width: number) => void
  toggleBottomPanel: () => void
  setBottomPanelHeight: (height: number) => void
}

// Changes are stored only once the stored state has been read.
let storageRead = false

/**
 * Sizes and visibility of the frame regions. They are device-local, so they are kept in the
 * browser and not on the server. AppFrame reads them after the first render, so the server HTML
 * and the first client render use the defaults.
 */
export const useFrameStore = create<FrameState>()(
  persist(
    (set) => ({
      sidePanelVisible: true,
      sidePanelWidth: SIDE_PANEL_DEFAULT_WIDTH,
      bottomPanelVisible: true,
      bottomPanelHeight: BOTTOM_PANEL_DEFAULT_HEIGHT,
      toggleSidePanel: () => {
        set((state) => ({ sidePanelVisible: !state.sidePanelVisible }))
      },
      setSidePanelVisible: (sidePanelVisible) => {
        set({ sidePanelVisible })
      },
      setSidePanelWidth: (sidePanelWidth) => {
        set({ sidePanelWidth })
      },
      toggleBottomPanel: () => {
        set((state) => ({ bottomPanelVisible: !state.bottomPanelVisible }))
      },
      setBottomPanelHeight: (bottomPanelHeight) => {
        set({ bottomPanelHeight })
      },
    }),
    {
      name: 'khoailanggraph-frame',
      skipHydration: true,
      storage: persistStorage<PersistedFrame>({ ready: () => storageRead }),
      onRehydrateStorage: () => () => {
        storageRead = true
      },
      partialize: ({
        sidePanelVisible,
        sidePanelWidth,
        bottomPanelVisible,
        bottomPanelHeight,
      }): PersistedFrame => ({
        sidePanelVisible,
        sidePanelWidth,
        bottomPanelVisible,
        bottomPanelHeight,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...parseStored(persistedFrameSchema, persisted),
      }),
    },
  ),
)
