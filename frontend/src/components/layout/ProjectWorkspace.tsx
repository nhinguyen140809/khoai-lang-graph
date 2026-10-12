'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useHotkey } from '@/hooks/useHotkey'
import { cn } from '@/lib/utils'

import { projectTabGroup, useEditorTabsStore } from './editor-tabs.store'
import { EditorTabs } from './EditorTabs'
import { useFrameStore } from './frame.store'
import { useFrameHydrated } from './hooks/useFrameHydrated'
import { useSideFeature } from './hooks/useSideFeature'
import { surfaceClassName } from './surface.config'

interface ProjectWorkspaceProps {
  projectId: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

const SIDE_PANEL_MIN_WIDTH = 180

/**
 * The side panel and the editor. The side panel is the one of the feature chosen on the activity
 * bar, and the editor follows the tabs, so choosing a feature does not change the editor. Ctrl+B
 * hides and shows the side panel, which keeps its width in pixels when the window is resized.
 */
export function ProjectWorkspace({ projectId, children }: ProjectWorkspaceProps) {
  const pathname = usePathname()
  const hydrated = useFrameHydrated()
  const sidePanelVisible = useFrameStore((state) => state.sidePanelVisible)
  const sideFeature = useSideFeature()
  const sideFeatureId = sideFeature?.id
  const sideFeatureChosen = useFrameStore((state) => state.sideFeature !== null)
  const setSideFeature = useFrameStore((state) => state.setSideFeature)
  const toggleSidePanel = useFrameStore((state) => state.toggleSidePanel)
  const setLastHref = useEditorTabsStore((state) => state.setLastHref)
  const group = projectTabGroup(projectId)

  useHotkey('b', toggleSidePanel, { mod: true })

  useEffect(() => {
    setLastHref(group, pathname)
  }, [group, pathname, setLastHref])

  // The first side panel is the one of the page opened; from then on it stays until another is
  // chosen.
  useEffect(() => {
    if (hydrated && !sideFeatureChosen && sideFeatureId !== undefined) setSideFeature(sideFeatureId)
  }, [hydrated, sideFeatureId, sideFeatureChosen, setSideFeature])

  return (
    // The stored width is read after the first render; the new key mounts the group with it.
    <ResizablePanelGroup
      key={hydrated ? 'stored' : 'default'}
      orientation="horizontal"
      className="min-h-0 flex-1"
    >
      {sidePanelVisible && sideFeature !== undefined && (
        <>
          <SidePanelArea>{sideFeature.panel}</SidePanelArea>
          <ResizableHandle />
        </>
      )}
      <ResizablePanel id="editor" minSize="30%">
        <div className={cn(surfaceClassName, 'flex h-full min-w-0 flex-col')}>
          <EditorTabs group={group} rootHref={sideFeature?.href} />
          <main className="min-h-0 flex-1 overflow-auto editor-text">{children}</main>
        </div>
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
