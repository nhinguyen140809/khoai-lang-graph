'use client'

import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SidePanelSectionProps {
  /** The name of the section, such as "Outline"; shown in capitals. */
  title: string
  /** Whether the section starts open. */
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * A part of a side panel that collapses to its title. Sections stack in the panel, and a line
 * divides each one from the section above it.
 */
export function SidePanelSection({ title, defaultOpen = true, children }: SidePanelSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="border-t first:border-t-0">
      <CollapsibleTrigger className="group/section flex h-6 w-full items-center gap-0.5 px-1 text-2xs font-semibold tracking-wide uppercase outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset">
        <ChevronRight
          aria-hidden
          className="size-4 shrink-0 transition-transform group-data-[state=open]/section:rotate-90 motion-reduce:transition-none"
        />
        <span className="truncate">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}
