import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorage, storageKey } from '@/lib/browser-storage.utils'

import { panelLayouts, PanelRegion } from './panel.constants'

const panelSchema = z.object({
  visible: z.boolean(),
  /** In pixels: the width of the side panel, the height of the panel under the editor. */
  size: z.number().positive(),
})

const persistedFrameSchema = z.object({
  /** The id of the feature whose side panel is shown, once chosen; the editor is not tied to it. */
  sideFeature: z.string().nullable().default(null),
  panels: z.object({ [PanelRegion.Side]: panelSchema, [PanelRegion.Bottom]: panelSchema }),
})

type PersistedFrame = z.infer<typeof persistedFrameSchema>

interface FrameState extends PersistedFrame {
  setSideFeature: (id: string) => void
  /** Shows the side panel of a feature, and the side panel if it was hidden. */
  showSideFeature: (id: string) => void
  togglePanel: (region: PanelRegion) => void
  setPanelSize: (region: PanelRegion, size: number) => void
}

/**
 * The feature whose side panel is shown, and the size and visibility of the panels. They are
 * device-local, so they are kept in the browser and not on the server. Workbench reads them after
 * the first render, so the server HTML and the first client render use the defaults.
 */
export const useFrameStore = create<FrameState>()(
  persist(
    (set) => ({
      sideFeature: null,
      panels: {
        [PanelRegion.Side]: { visible: true, size: panelLayouts[PanelRegion.Side].defaultSize },
        [PanelRegion.Bottom]: { visible: true, size: panelLayouts[PanelRegion.Bottom].defaultSize },
      },
      setSideFeature: (sideFeature) => {
        set({ sideFeature })
      },
      showSideFeature: (sideFeature) => {
        set((state) => ({
          sideFeature,
          panels: {
            ...state.panels,
            [PanelRegion.Side]: { ...state.panels[PanelRegion.Side], visible: true },
          },
        }))
      },
      togglePanel: (region) => {
        set((state) => {
          const panel = state.panels[region]
          return { panels: { ...state.panels, [region]: { ...panel, visible: !panel.visible } } }
        })
      },
      setPanelSize: (region, size) => {
        set((state) => ({
          panels: { ...state.panels, [region]: { ...state.panels[region], size } },
        }))
      },
    }),
    {
      name: storageKey('frame'),
      skipHydration: true,
      // Changes are stored only once the stored state has been read.
      storage: persistStorage<PersistedFrame>({
        ready: (): boolean => useFrameStore.persist.hasHydrated(),
      }),
      partialize: ({ sideFeature, panels }): PersistedFrame => ({ sideFeature, panels }),
      merge: (persisted, current) => ({
        ...current,
        ...parseStored(persistedFrameSchema, persisted),
      }),
    },
  ),
)
