'use client'

import { Activity, type ReactNode, useState } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/shared/ui/resizable'

import { useFrameStore } from '../frame.store'
import { useFrameHydrated } from '../hooks/useFrameHydrated'
import { panelLayouts, type PanelRegion } from './panel.constants'

interface EditorSplitProps {
  region: PanelRegion
  /** The content of the panel; without it, the editor takes the whole room. */
  panel?: ReactNode
  /** The editor. */
  children: ReactNode
}

/**
 * The editor and a panel of the frame, in the free height of their column, with a handle between
 * them. The layout of the region sets where the panel sits and how large it may be. The stored
 * size is read after the first render; the split then mounts again, so that it starts with it.
 */
export function EditorSplit({ region, panel, children }: EditorSplitProps) {
  const hydrated = useFrameHydrated()
  const { orientation, position, editorMinSize } = panelLayouts[region]
  const stored = panel === undefined ? null : <StoredPanel region={region}>{panel}</StoredPanel>

  return (
    <ResizablePanelGroup
      key={hydrated ? 'stored' : 'default'}
      orientation={orientation}
      className="min-h-0 flex-1"
    >
      {position === 'before' && stored}
      <ResizablePanel id={`${region}-editor`} minSize={editorMinSize}>
        {children}
      </ResizablePanel>
      {position === 'after' && stored}
    </ResizablePanelGroup>
  )
}

interface StoredPanelProps {
  region: PanelRegion
  children: ReactNode
}

/**
 * The panel, which the user resizes and hides; the frame stores both. It keeps its size in pixels
 * when the window is resized. Hiding it does not unmount it: it keeps its state, such as the text
 * of a search or a collapsed section, and the group gives it back its last size.
 */
function StoredPanel({ region, children }: StoredPanelProps) {
  const { position, minSize, maxSize } = panelLayouts[region]
  const visible = useFrameStore((state) => state.panels[region].visible)
  const setPanelSize = useFrameStore((state) => state.setPanelSize)
  // Read once: a stored size passed back while the user drags makes the panel register again,
  // which ends the drag after its first step.
  const [defaultSize] = useState(() => useFrameStore.getState().panels[region].size)

  return (
    <Activity mode={visible ? 'visible' : 'hidden'}>
      {position === 'after' && <ResizableHandle />}
      <ResizablePanel
        id={`${region}-panel`}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        groupResizeBehavior="preserve-pixel-size"
        onResize={(size) => {
          setPanelSize(region, Math.round(size.inPixels))
        }}
      >
        {children}
      </ResizablePanel>
      {position === 'before' && <ResizableHandle />}
    </Activity>
  )
}
