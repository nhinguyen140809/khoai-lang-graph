'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useHotkey } from '@/hooks/useHotkey'
import { cn } from '@/lib/utils'

import {
  featureHref,
  featureIcon,
  featureTabGroup,
  type ProjectFeature,
} from './activity-bar.config'
import { useEditorTabsStore } from './editor-tabs.store'
import { EditorTabs } from './EditorTabs'
import { useFrameStore } from './frame.store'
import { useFrameHydrated } from './hooks/useFrameHydrated'
import { surfaceClassName } from './surface.config'

interface WorkbenchProps {
  projectId: string
  feature: ProjectFeature
  /** The side panel of the feature, usually a SidePanel. Without one, the editor fills the workbench. */
  side?: ReactNode
  /** The editor: the page opened from the side panel. */
  children: ReactNode
}

const SIDE_PANEL_MIN_WIDTH = 180

/**
 * The side panel and the editor of one feature. Ctrl+B hides and shows the side panel, which
 * keeps its width in pixels when the window is resized.
 */
export function Workbench({ projectId, feature, side, children }: WorkbenchProps) {
  const pathname = usePathname()
  const hydrated = useFrameHydrated()
  const sidePanelVisible = useFrameStore((state) => state.sidePanelVisible)
  const sidePanelWidth = useFrameStore((state) => state.sidePanelWidth)
  const setSidePanelWidth = useFrameStore((state) => state.setSidePanelWidth)
  const toggleSidePanel = useFrameStore((state) => state.toggleSidePanel)
  const setLastHref = useEditorTabsStore((state) => state.setLastHref)
  const group = featureTabGroup(projectId, feature)

  useHotkey('b', toggleSidePanel, { mod: true, enabled: side !== undefined })

  useEffect(() => {
    setLastHref(group, pathname)
  }, [group, pathname, setLastHref])

  return (
    // The stored width is read after the first render; the new key mounts the group with it.
    <ResizablePanelGroup
      key={hydrated ? 'stored' : 'default'}
      orientation="horizontal"
      className="min-h-0 flex-1"
    >
      {sidePanelVisible && side !== undefined && (
        <>
          <ResizablePanel
            id="side-panel"
            defaultSize={sidePanelWidth}
            minSize={SIDE_PANEL_MIN_WIDTH}
            maxSize="50%"
            groupResizeBehavior="preserve-pixel-size"
            onResize={(size) => {
              setSidePanelWidth(Math.round(size.inPixels))
            }}
          >
            {side}
          </ResizablePanel>
          <ResizableHandle />
        </>
      )}
      <ResizablePanel id="editor" minSize="30%">
        <div className={cn(surfaceClassName, 'flex h-full min-w-0 flex-col')}>
          <EditorTabs
            group={group}
            rootHref={featureHref(projectId, feature)}
            defaultIcon={featureIcon(feature)}
          />
          <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
