import type { ReactNode } from 'react'

import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Surface } from '@/shared/components/ui/surface'

interface SidePanelProps {
  /** The name of the panel, such as "Artifacts". */
  title: string
  /** Buttons at the right of the title, such as a button that collapses every node of a tree. */
  actions?: ReactNode
  /** A row under the scroll area that stays in view while the content scrolls. */
  footer?: ReactNode
  /** Whether the whole panel scrolls as one; false when its children hold their own scroll areas. */
  isScrollable?: boolean
  children: ReactNode
}

/** Navigation inside one feature, left of the editor. */
export function SidePanel({
  title,
  actions,
  footer,
  isScrollable = true,
  children,
}: SidePanelProps) {
  return (
    <Surface as="aside" aria-label={title} className="flex h-full flex-col text-sidebar-foreground">
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 pr-1 pl-2">
        <h2 className="truncate text-sm font-semibold">{title}</h2>
        {actions !== undefined && <div className="flex items-center gap-0.5">{actions}</div>}
      </div>
      {isScrollable ? (
        <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
      ) : (
        <div className="min-h-0 flex-1">{children}</div>
      )}
      {footer !== undefined && (
        <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t px-3 py-1 text-xs">
          {footer}
        </div>
      )}
    </Surface>
  )
}
