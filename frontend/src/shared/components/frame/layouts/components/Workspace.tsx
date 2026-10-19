'use client'

import type { ReactNode } from 'react'

import { Surface } from '@/shared/components/ui/surface'

import { useSideFeature } from '../../destinations/hooks/useSideFeature'
import { EditorTabs } from '../../tabs/components/EditorTabs'
import { TabGroupContext } from '../../tabs/TabGroupContext'
import { SideFeatureSplit } from './SideFeatureSplit'

interface WorkspaceProps {
  /**
   * The tab group of the editor, which the layout names: each group keeps its own tabs, and the
   * pages inside open theirs in it.
   */
  tabGroup: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

/**
 * The side panel and the editor with its tabs. The side panel is the one of the feature chosen on
 * the activity bar, and the editor follows the tabs, so choosing a feature does not change the
 * editor. The panel keeps its width in pixels when the window is resized.
 */
export function Workspace({ tabGroup, children }: WorkspaceProps) {
  const { feature } = useSideFeature()

  return (
    <TabGroupContext value={tabGroup}>
      <SideFeatureSplit>
        <Surface className="flex h-full min-w-0 flex-col">
          <EditorTabs group={tabGroup} rootHref={feature?.href} />
          {/* The page fills the editor and scrolls itself: a ScrollArea when its content flows. */}
          <main className="min-h-0 flex-1">{children}</main>
        </Surface>
      </SideFeatureSplit>
    </TabGroupContext>
  )
}
