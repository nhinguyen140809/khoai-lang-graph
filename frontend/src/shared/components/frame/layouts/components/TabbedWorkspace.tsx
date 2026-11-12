'use client'

import type { ReactNode } from 'react'

import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Surface } from '@/shared/components/ui/surface'

import { useSideFeature } from '../../destinations/hooks/useSideFeature'
import { useKeepOnDoubleClick } from '../../hooks/useKeepOnDoubleClick'
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
 * panel keeps its width in pixels when the window is resized. A double click that follows the click
 * that opened a page keeps the tab of that page, wherever the second click lands.
 */
export function TabbedWorkspace({ tabGroup, children }: TabbedWorkspaceProps) {
  const { feature } = useSideFeature()
  useKeepOnDoubleClick()

  return (
    <SideFeatureSplit>
      <Surface className="flex h-full min-w-0 flex-col">
        <TabGroupContext value={tabGroup}>
          <EditorTabs rootHref={feature?.href} />
          {/* Every page scrolls in the editor, so no page makes a scroll area of its own: a page
              taller than the editor scrolls it, and a page that fills its height with `h-full`
              fills it and keeps the scrolling of its own parts. */}
          <main className="min-h-0 flex-1">
            <ScrollArea fillContent className="h-full">
              {children}
            </ScrollArea>
          </main>
        </TabGroupContext>
      </Surface>
    </SideFeatureSplit>
  )
}
