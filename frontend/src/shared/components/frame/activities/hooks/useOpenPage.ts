import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { useFrameStore } from '../../frame.store'
import { useActivities } from '../ActivitiesContext'
import { activityOfHref } from '../activity.utils'

/**
 * Opens a page together with the side panel of the feature that the page belongs to, as choosing
 * the feature on the activity bar would. A feature opens a page of another feature by its address
 * alone, without knowing that feature.
 */
export function useOpenPage() {
  const router = useRouter()
  const { activities } = useActivities()
  const showSideFeature = useFrameStore((state) => state.showSideFeature)

  return (href: Route) => {
    const feature = activityOfHref(activities, href)
    if (feature !== undefined) showSideFeature(feature.id)
    router.push(href)
  }
}
