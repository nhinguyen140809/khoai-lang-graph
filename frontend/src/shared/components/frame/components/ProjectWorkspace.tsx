'use client'

import type { ReactNode } from 'react'

import { Surface } from '@/shared/components/ui/surface'

import { useSideFeature } from '../activities/hooks/useSideFeature'
import { useSidePanelCommand } from '../hooks/useSidePanelCommand'
import { EditorSplit } from '../panels/components/EditorSplit'
import { PanelRegion } from '../panels/panel.constants'
import { EditorTabs } from '../tabs/components/EditorTabs'
import { projectTabGroup } from '../tabs/editor-tabs.utils'

interface ProjectWorkspaceProps {
  projectId: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

/**
 * The side panel and the editor. The side panel is the one of the feature chosen on the activity
 * bar, and the editor follows the tabs, so choosing a feature does not change the editor. Ctrl+B
 * hides and shows the side panel, which keeps its width in pixels when the window is resized.
 */
export function ProjectWorkspace({ projectId, children }: ProjectWorkspaceProps) {
  const { feature } = useSideFeature()
  const group = projectTabGroup(projectId)

  useSidePanelCommand()

  return (
    <EditorSplit region={PanelRegion.Side} panel={feature?.panel}>
      <Surface className="flex h-full min-w-0 flex-col">
        <EditorTabs group={group} rootHref={feature?.href} />
        {/* The page fills the editor and scrolls itself: a ScrollArea when its content flows. */}
        <main className="min-h-0 flex-1 editor-text">{children}</main>
      </Surface>
    </EditorSplit>
  )
}
