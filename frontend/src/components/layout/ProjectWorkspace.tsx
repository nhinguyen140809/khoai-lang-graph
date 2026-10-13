'use client'

import { PanelLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { ResizablePanel } from '@/components/ui/resizable'
import { Surface } from '@/components/ui/surface'

import { usePinSideFeature } from './activity-bar/hooks/usePinSideFeature'
import { useSideFeature } from './activity-bar/hooks/useSideFeature'
import type { PaletteCommand } from './command-palette/command.types'
import { useCommands } from './command-palette/hooks/useCommands'
import { projectTabGroup } from './editor/editor-tabs.store'
import { EditorTabs } from './editor/EditorTabs'
import { useFrameStore } from './frame.store'
import { StoredPanel, StoredPanelGroup } from './StoredPanel'

interface ProjectWorkspaceProps {
  projectId: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

const SIDE_PANEL_MIN_WIDTH = 180

const workspaceCommands: PaletteCommand[] = [
  {
    id: 'view.toggleSidePanel',
    label: 'Toggle side panel',
    group: 'View',
    icon: <PanelLeftIcon />,
    hotkey: { key: 'b', mod: true },
    run: () => {
      useFrameStore.getState().togglePanel('side')
    },
  },
]

/**
 * The side panel and the editor. The side panel is the one of the feature chosen on the activity
 * bar, and the editor follows the tabs, so choosing a feature does not change the editor. Ctrl+B
 * hides and shows the side panel, which keeps its width in pixels when the window is resized.
 */
export function ProjectWorkspace({ projectId, children }: ProjectWorkspaceProps) {
  const sideFeature = useSideFeature()
  const group = projectTabGroup(projectId)

  useCommands(workspaceCommands)
  usePinSideFeature(sideFeature?.id)

  return (
    <StoredPanelGroup orientation="horizontal" className="min-h-0 flex-1">
      {sideFeature !== undefined && (
        <StoredPanel region="side" minSize={SIDE_PANEL_MIN_WIDTH} maxSize="50%" handle="after">
          {sideFeature.panel}
        </StoredPanel>
      )}
      <ResizablePanel id="editor" minSize="30%">
        <Surface className="flex h-full min-w-0 flex-col">
          <EditorTabs group={group} rootHref={sideFeature?.href} />
          {/* The page fills the editor and scrolls itself: a ScrollArea when its content flows. */}
          <main className="min-h-0 flex-1 editor-text">{children}</main>
        </Surface>
      </ResizablePanel>
    </StoredPanelGroup>
  )
}
