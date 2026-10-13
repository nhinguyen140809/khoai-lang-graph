'use client'

import { ChevronDownIcon, ChevronUpIcon, PanelBottomIcon } from 'lucide-react'
import { Activity, type ReactNode } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Surface } from '@/shared/components/ui/surface'

import { PaletteGroup } from '../commands/command.constants'
import type { PaletteCommand } from '../commands/command.types'
import { useCommands } from '../commands/hooks/useCommands'
import { useFrameStore } from '../frame.store'
import { type BottomPanelSection, BottomPanelSections } from './BottomPanelSections'
import { EditorSplit } from './EditorSplit'
import { PanelRegion } from './panel.constants'

interface EditorWithBottomPanelProps {
  /** The sections of the panel under the editor, one tab each, such as the trace of an item. */
  sections: readonly BottomPanelSection[]
  /** The name of the panel, for the landmark and the show and hide buttons. */
  panelLabel: string
  children: ReactNode
}

const panelCommands: PaletteCommand[] = [
  {
    id: 'view.toggleBottomPanel',
    label: 'Toggle bottom panel',
    group: PaletteGroup.View,
    icon: <PanelBottomIcon />,
    hotkey: { key: '`', ctrl: true },
    run: () => {
      useFrameStore.getState().togglePanel(PanelRegion.Bottom)
    },
  },
]

/**
 * An editor with a panel under it, whose sections show as tabs. The panel can be resized and
 * hidden, with the button at the end of its tabs or Ctrl+`; both are remembered. Neither scrolls:
 * the editor content and each section scroll themselves when they flow.
 */
export function EditorWithBottomPanel({
  sections,
  panelLabel,
  children,
}: EditorWithBottomPanelProps) {
  const visible = useFrameStore((state) => state.panels[PanelRegion.Bottom].visible)

  useCommands(panelCommands)

  return (
    <div className="flex h-full flex-col gap-1.5">
      <EditorSplit
        region={PanelRegion.Bottom}
        panel={
          <Surface as="section" aria-label={panelLabel} className="h-full">
            <BottomPanelSections
              sections={sections}
              controls={<PanelToggle label={panelLabel} expanded />}
            />
          </Surface>
        }
      >
        <Surface className="h-full">{children}</Surface>
      </EditorSplit>
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
}

/** Hides or shows the panel under the editor. */
function PanelToggle({ label, expanded }: PanelToggleProps) {
  const togglePanel = useFrameStore((state) => state.togglePanel)
  const Icon = expanded ? ChevronDownIcon : ChevronUpIcon

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`${expanded ? 'Hide' : 'Show'} ${label}`}
      aria-expanded={expanded}
      onClick={() => {
        togglePanel(PanelRegion.Bottom)
      }}
    >
      <Icon aria-hidden />
    </Button>
  )
}
