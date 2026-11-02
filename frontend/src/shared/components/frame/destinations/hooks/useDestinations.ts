'use client'

import { createContext, useContext } from 'react'

import type { Destination } from '../destination.types'

interface FrameDestinations {
  /** The items of the activity bar, top to bottom; empty on a screen that gives none. */
  destinations: readonly Destination[]
}

/** The features of the screen. Workbench provides them, and `useDestinations` reads them. */
export const DestinationsContext = createContext<FrameDestinations>({
  destinations: [],
})

/** The features of the screen, which Workbench provides. */
export function useDestinations() {
  return useContext(DestinationsContext)
}
