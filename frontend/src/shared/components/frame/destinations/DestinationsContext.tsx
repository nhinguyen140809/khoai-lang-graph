'use client'

import { createContext } from 'react'

import type { Destination, TabIcons } from './destination.types'

interface FrameDestinations {
  /** The items of the activity bar, top to bottom; empty on a screen that gives none. */
  destinations: readonly Destination[]
  tabIcons: TabIcons
}

/**
 * The features of the screen and the icons of their tabs. Workbench provides them, and
 * `useDestinations` reads them.
 */
export const DestinationsContext = createContext<FrameDestinations>({
  destinations: [],
  tabIcons: {},
})
