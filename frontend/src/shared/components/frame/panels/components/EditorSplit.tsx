'use client'

import { Activity, type ReactNode, useState } from 'react'

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/shared/components/ui/resizable'

import { usePanel } from '../hooks/usePanel'
import { panelLayouts } from '../panel.constants'
import type { PanelRegion } from '../panel.types'

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
  const { restored } = usePanel(region)
  const { orientation, position, editorMinSize } = panelLayouts[region]
  const stored = panel === undefined ? null : <StoredPanel region={region}>{panel}</StoredPanel>

  return (
    <ResizablePanelGroup
      key={restored ? 'stored' : 'default'}
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
  const panel = usePanel(region)
  // Read once: a stored size passed back while the user drags makes the panel register again,
  // which ends the drag after its first step.
  const [defaultSize] = useState(panel.storedSize)

  return (
    <Activity mode={panel.visible ? 'visible' : 'hidden'}>
      {position === 'after' && <ResizableHandle />}
      <ResizablePanel
        id={`${region}-panel`}
        defaultSize={defaultSize}
        minSize={minSize}
        maxSize={maxSize}
        groupResizeBehavior="preserve-pixel-size"
        onResize={(size) => {
          panel.resize(Math.round(size.inPixels))
        }}
      >
        {children}
      </ResizablePanel>
      {position === 'before' && <ResizableHandle />}
    </Activity>
  )
}
