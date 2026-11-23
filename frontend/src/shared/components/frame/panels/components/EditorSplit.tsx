'use client'

import type { ReactNode } from 'react'

import {
  AnimatedResizablePanel,
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
 * when the window is resized. Hiding it shrinks it to nothing and showing it grows it back to its
 * last size, over a short time. It is never unmounted: it keeps its state, such as the text of a
 * search or a collapsed section. Once shrunk it cannot be seen or reached with the keyboard.
 * Dragging it narrower than its smallest size hides it.
 */
function StoredPanel({ region, children }: StoredPanelProps) {
  const { position, minSize, maxSize } = panelLayouts[region]
  const panel = usePanel(region)

  return (
    <AnimatedResizablePanel
      id={`${region}-panel`}
      isVisible={panel.visible}
      // The size is read once, as the panel mounts, and followed by the panel itself afterwards.
      defaultSize={panel.storedSize()}
      minSize={minSize}
      maxSize={maxSize}
      handle={position === 'after' ? 'before' : 'after'}
      onResize={panel.resize}
      onCollapse={panel.toggle}
    >
      {children}
    </AnimatedResizablePanel>
  )
}
