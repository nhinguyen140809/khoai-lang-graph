'use client'

import { type ReactNode, useEffect } from 'react'

import { CommandPalette } from './CommandPalette'
import { useEditorTabsStore } from './editor-tabs.store'
import { useFrameStore } from './frame.store'
import { StatusBar } from './StatusBar'

interface AppFrameProps {
  topBar: ReactNode
  /** The bar of features and the account. */
  activityBar?: ReactNode
  /** Whether the screen has a side panel that the command palette can show and hide. */
  sidePanel?: boolean
  /** What the status bar reports at its left; the bar is always shown. */
  status?: ReactNode
  /** Command groups for the command palette. */
  commands?: ReactNode
  /** Dialogs that commands or pages open, such as the new project dialog. */
  dialogs?: ReactNode
  children: ReactNode
}

/**
 * The frame of every screen: top bar, activity bar, content, status bar, and the command
 * palette. Feature content is passed in as props from src/app/.
 */
export function AppFrame({
  topBar,
  activityBar,
  sidePanel = false,
  status,
  commands,
  dialogs,
  children,
}: AppFrameProps) {
  useEffect(() => {
    // Read after the first render, so that it matches the server HTML.
    void useFrameStore.persist.rehydrate()
    void useEditorTabsStore.persist.rehydrate()
  }, [])

  return (
    <div className="flex h-svh flex-col bg-sidebar text-foreground">
      {topBar}
      <div className="flex min-h-0 flex-1">
        {activityBar}
        <div className="flex min-w-0 flex-1 flex-col pr-1.5 pb-1.5">{children}</div>
      </div>
      <StatusBar>{status}</StatusBar>
      <CommandPalette sidePanelCommand={sidePanel}>{commands}</CommandPalette>
      {dialogs}
    </div>
  )
}
