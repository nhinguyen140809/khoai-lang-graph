'use client'

import { PanelLeftIcon } from 'lucide-react'
import { Activity, type ReactNode, useState } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Surface } from '@/components/ui/surface'

import { usePinSideFeature } from './activity-bar/hooks/usePinSideFeature'
import { useSideFeature } from './activity-bar/hooks/useSideFeature'
import type { Command } from './command-palette/command.types'
import { useCommands } from './command-palette/hooks/useCommands'
import { projectTabGroup } from './editor/editor-tabs.store'
import { EditorTabs } from './editor/EditorTabs'
import { useFrameStore } from './frame.store'
import { useFrameHydrated } from './hooks/useFrameHydrated'

interface ProjectWorkspaceProps {
  projectId: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

const SIDE_PANEL_MIN_WIDTH = 180

const workspaceCommands: Command[] = [
  {
    id: 'view.toggleSidePanel',
    label: 'Toggle side panel',
    group: 'View',
    icon: <PanelLeftIcon />,
    hotkey: { key: 'b', mod: true },
    run: () => {
      useFrameStore.getState().toggleSidePanel()
    },
  },
]

/**
 * The side panel and the editor. The side panel is the one of the feature chosen on the activity
 * bar, and the editor follows the tabs, so choosing a feature does not change the editor. Ctrl+B
 * hides and shows the side panel, which keeps its width in pixels when the window is resized.
 */
export function ProjectWorkspace({ projectId, children }: ProjectWorkspaceProps) {
  const hydrated = useFrameHydrated()
  const sidePanelVisible = useFrameStore((state) => state.sidePanelVisible)
  const sideFeature = useSideFeature()
  const group = projectTabGroup(projectId)

  useCommands(workspaceCommands)
  usePinSideFeature(sideFeature?.id)

  return (
    // The stored width is read after the first render; the new key mounts the group with it.
    <ResizablePanelGroup
      key={hydrated ? 'stored' : 'default'}
      orientation="horizontal"
      className="min-h-0 flex-1"
    >
      {/* Ctrl+B hides the side panel without unmounting it: it keeps its state, such as the text
          of a search or a collapsed section, and the group gives it back its last width. */}
      <Activity mode={sidePanelVisible ? 'visible' : 'hidden'}>
        {sideFeature !== undefined && (
          <>
            <SidePanelArea>{sideFeature.panel}</SidePanelArea>
            <ResizableHandle />
          </>
        )}
      </Activity>
      <ResizablePanel id="editor" minSize="30%">
        <Surface className="flex h-full min-w-0 flex-col">
          <EditorTabs group={group} rootHref={sideFeature?.href} />
          {/* The page fills the editor and scrolls itself: a ScrollArea when its content flows. */}
          <main className="min-h-0 flex-1 editor-text">{children}</main>
        </Surface>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}

/**
 * The side panel in the group, sized in pixels. Its width is read from the store when it mounts
 * and saved while it is resized.
 */
function SidePanelArea({ children }: { children: ReactNode }) {
  const setSidePanelWidth = useFrameStore((state) => state.setSidePanelWidth)
  // Read once: a stored width passed back while the user drags makes the panel register again,
  // which ends the drag after its first step.
  const [defaultWidth] = useState(() => useFrameStore.getState().sidePanelWidth)

  return (
    <ResizablePanel
      id="side-panel"
      defaultSize={defaultWidth}
      minSize={SIDE_PANEL_MIN_WIDTH}
      maxSize="50%"
      groupResizeBehavior="preserve-pixel-size"
      onResize={(size) => {
        setSidePanelWidth(Math.round(size.inPixels))
      }}
    >
      {children}
    </ResizablePanel>
  )
}
