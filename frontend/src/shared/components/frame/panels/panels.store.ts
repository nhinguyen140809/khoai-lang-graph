import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorage, storageKey } from '@/shared/lib/browser-storage.utils'

import { panelLayouts, PanelRegion } from './panel.constants'

const panelSchema = z.object({
  visible: z.boolean(),
  /** In pixels: the width of the side panel, the height of the panel under the editor. */
  size: z.number().positive(),
})

const persistedPanelsSchema = z.object({
  panels: z.object({ [PanelRegion.Side]: panelSchema, [PanelRegion.Bottom]: panelSchema }),
})

type PersistedPanels = z.infer<typeof persistedPanelsSchema>

interface PanelsState extends PersistedPanels {
  showPanel: (region: PanelRegion) => void
  togglePanel: (region: PanelRegion) => void
  setPanelSize: (region: PanelRegion, size: number) => void
}

/**
 * The size and visibility of the panels that the user resizes and hides. They are device-local,
 * so they are kept in the browser and not on the server. They are read after the first render
 * (`useRestoreFrame`), so the server HTML and the first client render use the defaults.
 */
export const usePanelsStore = create<PanelsState>()(
  persist(
    (set) => ({
      panels: {
        [PanelRegion.Side]: { visible: true, size: panelLayouts[PanelRegion.Side].defaultSize },
        [PanelRegion.Bottom]: { visible: true, size: panelLayouts[PanelRegion.Bottom].defaultSize },
      },
      showPanel: (region) => {
        set((state) => ({
          panels: { ...state.panels, [region]: { ...state.panels[region], visible: true } },
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
      name: storageKey('panels'),
      skipHydration: true,
      // Changes are stored only once the stored state has been read.
      storage: persistStorage<PersistedPanels>({
        ready: (): boolean => usePanelsStore.persist.hasHydrated(),
      }),
      partialize: ({ panels }): PersistedPanels => ({ panels }),
      merge: (persisted, current) => ({
        ...current,
        ...parseStored(persistedPanelsSchema, persisted),
      }),
    },
  ),
)
