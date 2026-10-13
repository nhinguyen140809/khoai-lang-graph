'use client'

import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SidePanelSectionProps {
  /** The name of the section, such as "Outline"; shown in capitals. */
  title: string
  /**
   * Buttons at the right of the title, such as a button that refreshes the section. They show
   * while the pointer is over the title or the focus is on one of them.
   */
  actions?: ReactNode
  /** Whether the section starts open. */
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * A part of a side panel that collapses to its title. Sections stack in the panel, and a line
 * divides each one from the section above it.
 */
export function SidePanelSection({
  title,
  actions,
  defaultOpen = true,
  children,
}: SidePanelSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t first:border-t-0">
      <div className="group/header flex h-6 items-center hover:bg-sidebar-accent">
        <SectionTitle title={title} />
        {actions !== undefined && (
          <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover/header:opacity-100 focus-within:opacity-100">
            {actions}
          </div>
        )}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

/** The title, which opens and collapses the section. */
function SectionTitle({ title }: { title: string }) {
  return (
    <CollapsibleTrigger className="group/title flex h-full min-w-0 flex-1 items-center gap-0.5 px-1 text-2xs font-semibold tracking-wide uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset">
      <ChevronRight
        aria-hidden
        className="size-4 shrink-0 transition-transform group-data-[state=open]/title:rotate-90 motion-reduce:transition-none"
      />
      <span className="truncate">{title}</span>
    </CollapsibleTrigger>
  )
}
