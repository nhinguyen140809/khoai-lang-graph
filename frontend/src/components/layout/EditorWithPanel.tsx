'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { cn } from '@/lib/utils'

import { useFrameStore } from './frame.store'
import { useFrameHydrated } from './hooks/useFrameHydrated'
import { surfaceClassName } from './surface.config'

interface EditorWithPanelProps {
  /** The content of the panel under the editor, such as the trace of an item. */
  panel: ReactNode
  /** The name of the panel, for the landmark and the show and hide buttons. */
  panelLabel: string
  children: ReactNode
}

const PANEL_MIN_HEIGHT = 96

/** An editor with a panel under it. The panel can be resized and hidden; both are remembered. */
export function EditorWithPanel({ panel, panelLabel, children }: EditorWithPanelProps) {
  const hydrated = useFrameHydrated()
  const visible = useFrameStore((state) => state.bottomPanelVisible)
  const toggle = useFrameStore((state) => state.toggleBottomPanel)

  if (!visible) {
    return (
      <div className="flex h-full flex-col gap-1.5">
        <div className={cn(surfaceClassName, 'min-h-0 flex-1 overflow-auto')}>{children}</div>
        <section
          aria-label={panelLabel}
          className={cn(
            surfaceClassName,
            'flex h-8 shrink-0 items-center justify-between pr-1 pl-3',
          )}
        >
          <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
            {panelLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Show ${panelLabel}`}
            aria-expanded={false}
            onClick={toggle}
          >
            <ChevronUpIcon aria-hidden />
          </Button>
        </section>
      </div>
    )
  }

  return (
    <ResizablePanelGroup key={hydrated ? 'stored' : 'default'} orientation="vertical">
      <ResizablePanel id="editor-body" minSize="20%">
        <div className={cn(surfaceClassName, 'h-full overflow-auto')}>{children}</div>
      </ResizablePanel>
      <ResizableHandle />
      <BottomPanelArea>
        <section
          aria-label={panelLabel}
          className={cn(surfaceClassName, 'relative h-full overflow-auto')}
        >
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Hide ${panelLabel}`}
            aria-expanded
            onClick={toggle}
            className="absolute top-1.5 right-1 z-10"
          >
            <ChevronDownIcon aria-hidden />
          </Button>
          {panel}
        </section>
      </BottomPanelArea>
    </ResizablePanelGroup>
  )
}

/**
 * The panel under the editor in the group, sized in pixels. Its height is read from the store when
 * it mounts and saved while it is resized.
 */
function BottomPanelArea({ children }: { children: ReactNode }) {
  const setHeight = useFrameStore((state) => state.setBottomPanelHeight)
  // Read once: a stored height passed back while the user drags makes the panel register again,
  // which ends the drag after its first step.
  const [defaultHeight] = useState(() => useFrameStore.getState().bottomPanelHeight)

  return (
    <ResizablePanel
      id="bottom-panel"
      defaultSize={defaultHeight}
      minSize={PANEL_MIN_HEIGHT}
      maxSize="80%"
      groupResizeBehavior="preserve-pixel-size"
      onResize={(size) => {
        setHeight(Math.round(size.inPixels))
      }}
    >
      {children}
    </ResizablePanel>
  )
}
