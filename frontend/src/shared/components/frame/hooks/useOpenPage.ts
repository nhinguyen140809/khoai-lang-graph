'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { activityOfHref } from '../activities/activity.utils'
import { useActivities } from '../activities/hooks/useActivities'
import { useSideFeature } from '../activities/hooks/useSideFeature'
import { useEditorTabsStore } from '../tabs/editor-tabs.store'

interface OpenPageOptions {
  /**
   * Keeps the tab of the page instead of opening it as the preview tab, as a double click on a row
   * does.
   */
  keep?: boolean
}

/**
 * Opens a page together with the side panel of the feature that the page belongs to, as choosing
 * the feature on the activity bar would. A feature opens a page of another feature by its address
 * alone, without knowing that feature. The page opens in the preview tab unless `keep` is set.
 */
export function useOpenPage() {
  const router = useRouter()
  const { activities } = useActivities()
  const { show } = useSideFeature()
  const keepPage = useEditorTabsStore((state) => state.keepPage)

  return (href: Route, options: OpenPageOptions = {}) => {
    const feature = activityOfHref(activities, href)
    if (feature !== undefined) show(feature.id)
    if (options.keep === true) keepPage(href)
    router.push(href)
  }
}
