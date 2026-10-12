'use client'

import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { Activity, type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Surface } from '@/components/ui/surface'

import { useFrameStore } from '../frame.store'
import { useFrameHydrated } from '../hooks/useFrameHydrated'

interface EditorWithPanelProps {
  /** The content of the panel under the editor, such as the trace of an item. */
  panel: ReactNode
  /** The name of the panel, for the landmark and the show and hide buttons. */
  panelLabel: string
  children: ReactNode
}

const PANEL_MIN_HEIGHT = 96

/**
 * An editor with a panel under it. The panel can be resized and hidden; both are remembered.
 * Neither scrolls: the editor content and the panel content each scroll themselves when they flow.
 */
export function EditorWithPanel({ panel, panelLabel, children }: EditorWithPanelProps) {
  const hydrated = useFrameHydrated()
  const visible = useFrameStore((state) => state.bottomPanelVisible)

  return (
    <div className="flex h-full flex-col gap-1.5">
      {/* The stored height is read after the first render; the new key mounts the group with it. */}
      <ResizablePanelGroup
        key={hydrated ? 'stored' : 'default'}
        orientation="vertical"
        className="min-h-0 flex-1"
      >
        <ResizablePanel id="editor-body" minSize="20%">
          <Surface className="h-full">{children}</Surface>
        </ResizablePanel>
        {/* Hiding the panel does not unmount it: it keeps its state, and the group gives it back
            its last height. */}
        <Activity mode={visible ? 'visible' : 'hidden'}>
          <ResizableHandle />
          <BottomPanelArea>
            <Surface as="section" aria-label={panelLabel} className="relative h-full">
              <PanelToggle label={panelLabel} expanded className="absolute top-1.5 right-1 z-10" />
              {panel}
            </Surface>
          </BottomPanelArea>
        </Activity>
      </ResizablePanelGroup>
      <Activity mode={visible ? 'hidden' : 'visible'}>
        <CollapsedPanel label={panelLabel} />
      </Activity>
    </div>
  )
}

/** The panel while it is hidden: a bar with its name, which shows it again. */
function CollapsedPanel({ label }: { label: string }) {
  return (
    <Surface
      as="section"
      aria-label={label}
      className="flex h-8 shrink-0 items-center justify-between pr-1 pl-3"
    >
      <span className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <PanelToggle label={label} expanded={false} />
    </Surface>
  )
}

interface PanelToggleProps {
  /** The name of the panel. */
  label: string
  /** The panel is shown, so the button hides it. */
  expanded: boolean
  className?: string
}

/** Hides or shows the panel under the editor. */
function PanelToggle({ label, expanded, className }: PanelToggleProps) {
  const toggle = useFrameStore((state) => state.toggleBottomPanel)
  const Icon = expanded ? ChevronDownIcon : ChevronUpIcon

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`${expanded ? 'Hide' : 'Show'} ${label}`}
      aria-expanded={expanded}
      onClick={toggle}
      className={className}
    >
      <Icon aria-hidden />
    </Button>
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
