'use client'

import type { Route } from 'next'
import { useRouter } from 'next/navigation'

import { destinationOfHref } from '../destinations/destination.utils'
import { useDestinations } from '../destinations/hooks/useDestinations'
import { useSideFeature } from '../destinations/hooks/useSideFeature'
import { useEditorTabsStore } from '../tabs/editor-tabs.store'
import { useTabGroup } from '../tabs/hooks/useTabGroup'

interface OpenPageOptions {
  /**
   * Keeps the tab of the page instead of opening it as the preview tab, as a double click on a row
   * does.
   */
  keep?: boolean
  /**
   * Opens the page in the place of the tab on screen, with that tab's state, as a page that reads
   * through a list does when it moves to the next entry.
   */
  inPlace?: boolean
  /** What the opener calls the page, which names its tab until the page knows its own title. */
  title?: string
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
  const replacePage = useEditorTabsStore((state) => state.replacePage)
  const namePage = useEditorTabsStore((state) => state.namePage)
  const group = useTabGroup()

  return (href: Route, options: OpenPageOptions = {}) => {
    const feature = destinationOfHref(destinations, href)
    if (feature !== undefined) show(feature.id)
    if (options.title !== undefined) namePage(href, options.title)
    if (options.keep === true) keepPage(href)
    if (options.inPlace === true && group !== null) {
      const tabId = useEditorTabsStore.getState().onScreen[group]
      if (tabId !== undefined) replacePage(href, tabId)
    }
    router.push(href)
  }
}
