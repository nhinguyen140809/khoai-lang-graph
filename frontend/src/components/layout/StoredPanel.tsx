'use client'

import { Activity, type ComponentProps, type ReactNode, useState } from 'react'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

import { type PanelRegion, useFrameStore } from './frame.store'
import { useFrameHydrated } from './hooks/useFrameHydrated'

/**
 * A group of resizable panels that holds a `StoredPanel`. The stored sizes are read after the first
 * render; the group then mounts again, so that it starts with them.
 */
export function StoredPanelGroup(props: ComponentProps<typeof ResizablePanelGroup>) {
  const hydrated = useFrameHydrated()

  return <ResizablePanelGroup key={hydrated ? 'stored' : 'default'} {...props} />
}

interface StoredPanelProps {
  region: PanelRegion
  /** In pixels. */
  minSize: number
  /** A share of the group, such as `50%`. */
  maxSize: string
  /** Where the resize handle sits in the group: before the panel or after it. */
  handle: 'before' | 'after'
  children: ReactNode
}

/**
 * A panel of the frame that the user resizes and hides; the frame stores both. It keeps its size
 * in pixels when the window is resized. Hiding it does not unmount it: it keeps its state, such as
 * the text of a search or a collapsed section, and the group gives it back its last size.
 */
export function StoredPanel({ region, minSize, maxSize, handle, children }: StoredPanelProps) {
  const visible = useFrameStore((state) => state.panels[region].visible)
  const setPanelSize = useFrameStore((state) => state.setPanelSize)
  // Read once: a stored size passed back while the user drags makes the panel register again,
  // which ends the drag after its first step.
  const [defaultSize] = useState(() => useFrameStore.getState().panels[region].size)

  return (
    <Activity mode={visible ? 'visible' : 'hidden'}>
      {handle === 'before' && <ResizableHandle />}
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
      {handle === 'after' && <ResizableHandle />}
    </Activity>
  )
}
