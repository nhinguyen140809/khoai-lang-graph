import { useSyncExternalStore } from 'react'

import type { PanelRegion } from '../panel.types'
import { usePanelsStore } from '../panels.store'

const subscribe = (onChange: () => void) => usePanelsStore.persist.onFinishHydration(onChange)
const hasRestored = () => usePanelsStore.persist.hasHydrated()
const isRestoredOnServer = () => false

/**
 * A panel of the frame that the user resizes and hides: whether it is shown, and the actions that
 * change it. `restored` is false until the stored sizes are read after the first render.
 * `storedSize` reads the size without following it, for a panel that takes it once as it mounts.
 */
export function usePanel(region: PanelRegion) {
  const isVisible = usePanelsStore((state) => state.panels[region].visible)
  const showPanel = usePanelsStore((state) => state.showPanel)
  const togglePanel = usePanelsStore((state) => state.togglePanel)
  const setPanelSize = usePanelsStore((state) => state.setPanelSize)
  const isRestored = useSyncExternalStore(subscribe, hasRestored, isRestoredOnServer)

  return {
    visible: isVisible,
    restored: isRestored,
    storedSize: () => usePanelsStore.getState().panels[region].size,
    show: () => {
      showPanel(region)
    },
    toggle: () => {
      togglePanel(region)
    },
    resize: (size: number) => {
      setPanelSize(region, size)
    },
  }
}
