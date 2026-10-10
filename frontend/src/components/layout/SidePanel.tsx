import type { ReactNode } from 'react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

import { surfaceClassName } from './surface.config'

interface SidePanelProps {
  /** The name of the panel, such as "Threads"; shown in capitals. */
  title: string
  /** Buttons at the right of the title, such as a button that adds a thread. */
  actions?: ReactNode
  children: ReactNode
}

/** Navigation inside one feature, left of the editor. */
export function SidePanel({ title, actions, children }: SidePanelProps) {
  return (
    <aside
      aria-label={title}
      className={cn(surfaceClassName, 'flex h-full flex-col text-sidebar-foreground')}
    >
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 pr-1 pl-3">
        <h2 className="truncate text-[0.6875rem] font-medium tracking-wide uppercase">{title}</h2>
        {actions !== undefined && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>
      <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
    </aside>
  )
}
