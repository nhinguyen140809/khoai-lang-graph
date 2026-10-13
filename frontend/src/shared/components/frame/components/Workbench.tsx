'use client'

import { type ReactNode, useMemo } from 'react'

import { ActivitiesContext } from '../activities/ActivitiesContext'
import type { Activity, TabIcons } from '../activities/activity.types'
import { ActivityBar } from '../activities/components/ActivityBar'
import { FeatureCommands } from '../activities/components/FeatureCommands'
import { StatusBar } from '../bars/components/StatusBar'
import { TopBar } from '../bars/components/TopBar'
import { CommandPalette } from '../commands/components/CommandPalette'
import { useRestoreFrame } from '../hooks/useRestoreFrame'

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
  /**
   * Components that render nothing and add to the frame what belongs to no page: commands with
   * `useCommands`, such as the projects to open, and items of the status bar with
   * `useStatusBarItem`, such as the run of the project. The frame registers its own, and a page
   * registers what acts on it.
   */
  contributions?: ReactNode
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
  contributions,
  dialogs,
  children,
}: WorkbenchProps) {
  const frameActivities = useMemo(() => ({ activities, tabIcons }), [activities, tabIcons])

  useRestoreFrame(activities)

  return (
    <ActivitiesContext value={frameActivities}>
      <div className="flex h-svh flex-col bg-sidebar text-foreground">
        <TopBar crumb={crumb} />
        <div className="flex min-h-0 flex-1">
          <ActivityBar account={account} />
          <div className="flex min-w-0 flex-1 flex-col pr-1.5 pb-1.5">{children}</div>
        </div>
        <StatusBar />
        <CommandPalette />
        <FeatureCommands />
        {contributions}
        {dialogs}
      </div>
    </ActivitiesContext>
  )
}
