import { usePathname } from 'next/navigation'

import { usePanel } from '../../panels/hooks/usePanel'
import { PanelRegion } from '../../panels/panel.constants'
import type { FeatureActivity } from '../activity.types'
import { activityOfHref, isFeatureActivity } from '../activity.utils'
import { useSideFeatureStore } from '../side-feature.store'
import { useActivities } from './useActivities'

/**
 * The feature whose side panel is shown, and the actions that change it. The feature is the one
 * the user chose on the activity bar; until one is chosen, it is the feature of the page on
 * screen, else the first feature. Undefined when the screen has no features.
 */
export function useSideFeature() {
  const pathname = usePathname()
  const { activities } = useActivities()
  const chosen = useSideFeatureStore((state) => state.chosen)
  const choose = useSideFeatureStore((state) => state.choose)
  const sidePanel = usePanel(PanelRegion.Side)
  const features = activities.filter(isFeatureActivity)
  const feature: FeatureActivity | undefined =
    features.find(({ id }) => id === chosen) ?? activityOfHref(features, pathname) ?? features[0]

  /** Shows the side panel of feature `id`, and the side panel if it was hidden. */
  const show = (id: string) => {
    choose(id)
    sidePanel.show()
  }

  return {
    feature,
    show,
    /**
     * As an item of the activity bar does, like an editor: the item of the feature shown hides or
     * shows the side panel, another item shows its feature.
     */
    toggle: (id: string) => {
      if (feature?.id === id) sidePanel.toggle()
      else show(id)
    },
  }
}
