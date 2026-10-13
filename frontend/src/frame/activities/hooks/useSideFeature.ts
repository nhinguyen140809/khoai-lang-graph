import { usePathname } from 'next/navigation'

import { useFrameStore } from '../../frame.store'
import { useActivities } from '../ActivitiesContext'
import type { FeatureActivity } from '../activity.types'
import { activityOfHref, isFeatureActivity } from '../activity.utils'

/**
 * The feature whose side panel is shown. It is the one the user chose on the activity bar; until
 * one is chosen, it is the feature of the page on screen, else the first feature. Undefined when
 * the screen has no features.
 */
export function useSideFeature(): FeatureActivity | undefined {
  const pathname = usePathname()
  const { activities } = useActivities()
  const chosen = useFrameStore((state) => state.sideFeature)
  const features = activities.filter(isFeatureActivity)
  return (
    features.find((feature) => feature.id === chosen) ??
    activityOfHref(features, pathname) ??
    features[0]
  )
}
