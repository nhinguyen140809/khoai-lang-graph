'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { destinationOfHref } from '../destinations/destination.utils'
import { useDestinations } from '../destinations/hooks/useDestinations'
import { useSideFeature } from '../destinations/hooks/useSideFeature'
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
  const { destinations } = useDestinations()
  const { show } = useSideFeature()
  const keepPage = useEditorTabsStore((state) => state.keepPage)

  return (href: Route, options: OpenPageOptions = {}) => {
    const feature = destinationOfHref(destinations, href)
    if (feature !== undefined) show(feature.id)
    if (options.keep === true) keepPage(href)
    router.push(href)
  }
}
