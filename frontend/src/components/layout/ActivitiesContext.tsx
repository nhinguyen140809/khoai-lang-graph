'use client'

import { createContext, useContext } from 'react'

import type { Activity, TabIcons } from './activity.types'

interface FrameActivities {
  /** The items of the activity bar, top to bottom; empty outside a project. */
  activities: readonly Activity[]
  tabIcons: TabIcons
}

/**
 * The features of the screen and the icons of their tabs. AppFrame provides them; the activity
 * bar, the side panel, the tabs and the command palette read them.
 */
export const ActivitiesContext = createContext<FrameActivities>({ activities: [], tabIcons: {} })

export function useActivities() {
  return useContext(ActivitiesContext)
}
