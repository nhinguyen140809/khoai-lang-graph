'use client'

import { type ReactNode, useEffect, useMemo } from 'react'

import { ActivitiesContext } from './activities/ActivitiesContext'
import type { Activity, TabIcons } from './activities/activity.types'
import { ActivityBar } from './activities/ActivityBar'
import { StatusBar } from './bars/StatusBar'
import { TopBar } from './bars/TopBar'
import { CommandPalette } from './commands/CommandPalette'
import { FeatureCommands } from './commands/FeatureCommands'
import { useFrameStore } from './frame.store'
import { useEditorTabsStore } from './tabs/editor-tabs.store'

interface WorkbenchProps {
  /** What follows "khoai /" on the top bar: a page name, or the menu of the current project. */
  crumb: ReactNode
  /** The account menu, at the bottom of the activity bar. */
  account: ReactNode
  /**
   * The features of the screen, top to bottom on the activity bar, each with its side panel.
   * Without a feature, the screen has no side panel.
   */
  activities?: readonly Activity[]
  /** The icons that the pages of the features name for their tabs. */
  tabIcons?: TabIcons
  /** What the status bar reports at its left; the bar is always shown. */
  status?: ReactNode
  /**
   * Components that register the commands of the screen with `useCommands`, such as the projects
   * to open; they render nothing. The frame registers its own, and a page registers the commands
   * that act on it.
   */
  commands?: ReactNode
  /** Dialogs that commands or pages open, such as the new project dialog. */
  dialogs?: ReactNode
  children: ReactNode
}

const noActivities: readonly Activity[] = []
const noTabIcons: TabIcons = {}

/**
 * The frame of every screen: top bar, activity bar, content, status bar, and the command
 * palette. The frame renders its bars itself; what they show from the features, the features
 * themselves included, is passed in as props from src/app/.
 */
export function Workbench({
  crumb,
  account,
  activities = noActivities,
  tabIcons = noTabIcons,
  status,
  commands,
  dialogs,
  children,
}: WorkbenchProps) {
  const frameActivities = useMemo(() => ({ activities, tabIcons }), [activities, tabIcons])

  useEffect(() => {
    // Read after the first render, so that it matches the server HTML.
    void useFrameStore.persist.rehydrate()
    void useEditorTabsStore.persist.rehydrate()
  }, [])

  return (
    <ActivitiesContext value={frameActivities}>
      <div className="flex h-svh flex-col bg-sidebar text-foreground">
        <TopBar crumb={crumb} />
        <div className="flex min-h-0 flex-1">
          <ActivityBar account={account} />
          <div className="flex min-w-0 flex-1 flex-col pr-1.5 pb-1.5">{children}</div>
        </div>
        <StatusBar>{status}</StatusBar>
        <CommandPalette />
        <FeatureCommands />
        {commands}
        {dialogs}
      </div>
    </ActivitiesContext>
  )
}
