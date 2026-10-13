'use client'

import { ChevronDownIcon, ChevronUpIcon, PanelBottomIcon } from 'lucide-react'
import { Activity, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { ResizablePanel } from '@/components/ui/resizable'
import { Surface } from '@/components/ui/surface'

import type { Command } from '../command-palette/command.types'
import { useCommands } from '../command-palette/hooks/useCommands'
import { useFrameStore } from '../frame.store'
import { StoredPanel, StoredPanelGroup } from '../StoredPanel'

interface EditorWithPanelProps {
  /** The content of the panel under the editor, such as the trace of an item. */
  panel: ReactNode
  /** The name of the panel, for the landmark and the show and hide buttons. */
  panelLabel: string
  children: ReactNode
}

const PANEL_MIN_HEIGHT = 96

const panelCommands: Command[] = [
  {
    id: 'view.toggleBottomPanel',
    label: 'Toggle bottom panel',
    group: 'View',
    icon: <PanelBottomIcon />,
    hotkey: { key: '`', ctrl: true },
    run: () => {
      useFrameStore.getState().togglePanel('bottom')
    },
  },
]

/**
 * An editor with a panel under it. The panel can be resized and hidden, with its button or Ctrl+`;
 * both are remembered. Neither scrolls: the editor content and the panel content each scroll
 * themselves when they flow.
 */
export function EditorWithPanel({ panel, panelLabel, children }: EditorWithPanelProps) {
  const visible = useFrameStore((state) => state.panels.bottom.visible)

  useCommands(panelCommands)

  return (
    <div className="flex h-full flex-col gap-1.5">
      <StoredPanelGroup orientation="vertical" className="min-h-0 flex-1">
        <ResizablePanel id="editor-body" minSize="20%">
          <Surface className="h-full">{children}</Surface>
        </ResizablePanel>
        <StoredPanel region="bottom" minSize={PANEL_MIN_HEIGHT} maxSize="80%" handle="before">
          <Surface as="section" aria-label={panelLabel} className="relative h-full">
            <PanelToggle label={panelLabel} expanded className="absolute top-1.5 right-1 z-10" />
            {panel}
          </Surface>
        </StoredPanel>
      </StoredPanelGroup>
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
  const togglePanel = useFrameStore((state) => state.togglePanel)
  const Icon = expanded ? ChevronDownIcon : ChevronUpIcon

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`${expanded ? 'Hide' : 'Show'} ${label}`}
      aria-expanded={expanded}
      onClick={() => {
        togglePanel('bottom')
      }}
      className={className}
    >
      <Icon aria-hidden />
    </Button>
  )
}
