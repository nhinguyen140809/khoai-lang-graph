'use client'

import { type ReactNode, useEffect, useMemo } from 'react'

import { ActivitiesContext } from './ActivitiesContext'
import type { Activity, TabIcons } from './activity.types'
import { isFeatureActivity } from './activity.utils'
import { CommandPalette } from './CommandPalette'
import { useEditorTabsStore } from './editor-tabs.store'
import { FeatureCommands } from './FeatureCommands'
import { useFrameStore } from './frame.store'
import { StatusBar } from './StatusBar'

interface AppFrameProps {
  topBar: ReactNode
  /** The bar of features and the account. */
  activityBar?: ReactNode
  /**
   * The features of the screen, top to bottom on the activity bar, each with its side panel.
   * Without a feature, the screen has no side panel.
   */
  activities?: readonly Activity[]
  /** The icons that the pages of the features name for their tabs. */
  tabIcons?: TabIcons
  /** What the status bar reports at its left; the bar is always shown. */
  status?: ReactNode
  /** Command groups for the command palette, after the commands that show a feature. */
  commands?: ReactNode
  /** Dialogs that commands or pages open, such as the new project dialog. */
  dialogs?: ReactNode
  children: ReactNode
}

const noActivities: readonly Activity[] = []
const noTabIcons: TabIcons = {}

/**
 * The frame of every screen: top bar, activity bar, content, status bar, and the command
 * palette. Feature content, the features themselves included, is passed in as props from
 * src/app/.
 */
export function AppFrame({
  topBar,
  activityBar,
  activities = noActivities,
  tabIcons = noTabIcons,
  status,
  commands,
  dialogs,
  children,
}: AppFrameProps) {
  const frameActivities = useMemo(() => ({ activities, tabIcons }), [activities, tabIcons])
  const hasFeatures = activities.some(isFeatureActivity)

  useEffect(() => {
    // Read after the first render, so that it matches the server HTML.
    void useFrameStore.persist.rehydrate()
    void useEditorTabsStore.persist.rehydrate()
  }, [])

  return (
    <ActivitiesContext value={frameActivities}>
      <div className="flex h-svh flex-col bg-sidebar text-foreground">
        {topBar}
        <div className="flex min-h-0 flex-1">
          {activityBar}
          <div className="flex min-w-0 flex-1 flex-col pr-1.5 pb-1.5">{children}</div>
        </div>
        <StatusBar>{status}</StatusBar>
        <CommandPalette sidePanelCommand={hasFeatures}>
          {hasFeatures && <FeatureCommands />}
          {commands}
        </CommandPalette>
        {dialogs}
      </div>
    </ActivitiesContext>
  )
}
