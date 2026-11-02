import { createElement, type ReactNode } from 'react'

import type { Destination, TabIcons } from '../destinations/destination.types'
import { DestinationsContext } from '../destinations/hooks/useDestinations'
import { TabGroupContext } from '../tabs/hooks/useTabGroup'
import { useTabIcons } from '../tabs/hooks/useTabIcons'

interface FrameOptions {
  /** The features of the screen; none by default. */
  destinations?: readonly Destination[]
  /** The tab group of the workspace around the component; none by default, as outside a workspace. */
  tabGroup?: string | null
  /** Tab icons to register, as a layout registers those of its features. */
  tabIcons?: TabIcons
}

function RegisteredTabIcons({ icons }: { icons: TabIcons }) {
  useTabIcons(icons)
  return null
}

/**
 * A wrapper for `render` and `renderHook` that gives the component under test what the frame gives
 * its pages: the features of the screen, the tab group of the workspace around it, and the tab icons
 * of the features.
 */
export function frameWrapper({ destinations = [], tabGroup = null, tabIcons }: FrameOptions = {}) {
  return function FrameWrapper({ children }: { children: ReactNode }) {
    return createElement(
      DestinationsContext,
      { value: { destinations } },
      tabIcons === undefined ? null : createElement(RegisteredTabIcons, { icons: tabIcons }),
      createElement(TabGroupContext, { value: tabGroup }, children),
    )
  }
}
