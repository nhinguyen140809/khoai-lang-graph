'use client'

import type { Route } from 'next'
import { type ReactNode, useMemo } from 'react'

import { StatusBar } from '../../bars/components/StatusBar'
import { TopBar } from '../../bars/components/TopBar'
import { CommandPalette } from '../../commands/components/CommandPalette'
import { ActivityBar } from '../../destinations/components/ActivityBar'
import { FeatureCommands } from '../../destinations/components/FeatureCommands'
import type { Destination } from '../../destinations/destination.types'
import { DestinationsContext } from '../../destinations/hooks/useDestinations'
import { useRestoreFrame } from '../../hooks/useRestoreFrame'

interface WorkbenchProps {
  /** What follows "khoai /" on the top bar: a page name, or the menu of the current project. */
  crumb: ReactNode
  /** The address of the home page, which the mark of the app on the top bar leads to. */
  homeHref: Route
  /**
   * The features of the screen, top to bottom on the activity bar, each with its side panel.
   * Without a feature, the screen has no side panel.
   */
  destinations?: readonly Destination[]
  /**
   * Components that render nothing and add to the frame what belongs to no page: commands with
   * `useCommands`, such as the projects to open, items of the status bar with `useStatusBarItem`,
   * such as the run of the project, and items of the activity bar with `useActivityBarItem`, such
   * as the account menu. The frame registers its own, and a page registers what acts on it.
   */
  contributions?: ReactNode
  children: ReactNode
}

const noDestinations: readonly Destination[] = []

/**
 * The frame of every screen: top bar, activity bar, content, status bar, and the command
 * palette. The frame renders its bars itself; what they show from the features, the features
 * themselves included, is passed in as props from src/app/, or registered with hooks by the
 * components in `contributions`, such as the account menu with `useActivityBarItem`.
 */
export function Workbench({
  crumb,
  homeHref,
  destinations = noDestinations,
  contributions,
  children,
}: WorkbenchProps) {
  const frameDestinations = useMemo(() => ({ destinations }), [destinations])

  useRestoreFrame(destinations)

  return (
    <DestinationsContext value={frameDestinations}>
      <div className="flex h-svh flex-col bg-sidebar text-foreground">
        <TopBar crumb={crumb} homeHref={homeHref} />
        <div className="flex min-h-0 flex-1">
          <ActivityBar />
          <div className="flex min-w-0 flex-1 flex-col pr-1.5">{children}</div>
        </div>
        <StatusBar />
        <CommandPalette />
        <FeatureCommands />
        {contributions}
      </div>
    </DestinationsContext>
  )
}
