'use client'

import type { ReactNode } from 'react'

import { ScrollArea } from '@/shared/components/ui/scroll-area'
import { Surface } from '@/shared/components/ui/surface'

import { SideFeatureSplit } from './SideFeatureSplit'

interface UntabbedWorkspaceProps {
  /** The page, beside the side panel. */
  children: ReactNode
}

/**
 * The side panel and the page, for the screens outside a project, which have no tabs. The page scrolls in it, as in the editor of the tabs. The side
 * panel is the one of the feature chosen on the activity bar, else of the page on screen, else of
 * the first feature.
 * @view developer
 */
export function UntabbedWorkspace({ children }: UntabbedWorkspaceProps) {
  return (
    <SideFeatureSplit>
      <Surface as="main" className="h-full min-w-0">
        {/* Every page scrolls here, so no page makes a scroll area of its own: a page taller than
            this scrolls it, and a page that fills its height keeps the scrolling of its own parts. */}
        <ScrollArea fillContent className="h-full">
          <div className="flex h-full flex-col">{children}</div>
        </ScrollArea>
      </Surface>
    </SideFeatureSplit>
  )
}
