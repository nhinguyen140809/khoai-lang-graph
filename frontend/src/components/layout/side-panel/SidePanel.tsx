import type { ReactNode } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Surface } from '@/components/ui/surface'

interface SidePanelProps {
  /** The name of the panel, such as "Artifacts"; shown in capitals. */
  title: string
  /** Buttons at the right of the title, such as a button that collapses every node of a tree. */
  actions?: ReactNode
  children: ReactNode
}

/** Navigation inside one feature, left of the editor. */
export function SidePanel({ title, actions, children }: SidePanelProps) {
  return (
    <Surface as="aside" aria-label={title} className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 pr-1 pl-3">
        <h2 className="truncate text-2xs font-medium tracking-wide uppercase">{title}</h2>
        {actions !== undefined && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>
      <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
    </Surface>
  )
}
