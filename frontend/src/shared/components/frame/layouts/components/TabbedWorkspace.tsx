'use client'

import type { ReactNode } from 'react'

import { Surface } from '@/shared/components/ui/surface'

import { useSideFeature } from '../../destinations/hooks/useSideFeature'
import { EditorTabs } from '../../tabs/components/EditorTabs'
import { TabGroupContext } from '../../tabs/hooks/useTabGroup'
import { SideFeatureSplit } from './SideFeatureSplit'

interface TabbedWorkspaceProps {
  /** The tab group, named by the layout, that the tabs show and the pages inside open theirs in. */
  tabGroup: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

/**
 * The side panel and the editor. The side panel is the one of the feature chosen on the activity
 * bar, and the editor follows the tabs, so choosing a feature does not change the editor. The
 * panel keeps its width in pixels when the window is resized.
 */
export function TabbedWorkspace({ tabGroup, children }: TabbedWorkspaceProps) {
  const { feature } = useSideFeature()

  return (
    <SideFeatureSplit>
      <Surface className="flex h-full min-w-0 flex-col">
        <TabGroupContext value={tabGroup}>
          <EditorTabs rootHref={feature?.href} />
          {/* The page fills the editor and scrolls itself: a ScrollArea when its content flows. */}
          <main className="min-h-0 flex-1">{children}</main>
        </TabGroupContext>
      </Surface>
    </SideFeatureSplit>
  )
}
