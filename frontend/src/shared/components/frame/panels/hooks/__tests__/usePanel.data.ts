import { panelLayouts } from '../../panel.constants'
import { PanelRegion } from '../../panel.types'
import type { usePanel } from '../usePanel'

type Panel = ReturnType<typeof usePanel>

/** A panel, a change made through the hook, and whether the panel is shown after it. */
export const visibilityCases: {
  name: string
  region: PanelRegion
  visibleBefore: boolean
  change: (panel: Panel) => void
  visible: boolean
}[] = [
  {
    name: 'hides a shown side panel when toggled',
    region: PanelRegion.Side,
    visibleBefore: true,
    change: (panel) => {
      panel.toggle()
    },
    visible: false,
  },
  {
    name: 'shows a hidden bottom panel when toggled',
    region: PanelRegion.Bottom,
    visibleBefore: false,
    change: (panel) => {
      panel.toggle()
    },
    visible: true,
  },
  {
    name: 'shows a hidden side panel',
    region: PanelRegion.Side,
    visibleBefore: false,
    change: (panel) => {
      panel.show()
    },
    visible: true,
  },
  {
    name: 'keeps a shown bottom panel shown',
    region: PanelRegion.Bottom,
    visibleBefore: true,
    change: (panel) => {
      panel.show()
    },
    visible: true,
  },
]

/** A panel, and the size it starts with. */
export const defaultSizeCases = [PanelRegion.Side, PanelRegion.Bottom].map((region) => ({
  name: `the ${region} panel`,
  region,
  size: panelLayouts[region].defaultSize,
}))
