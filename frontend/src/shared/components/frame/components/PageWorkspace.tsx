'use client'

import type { ReactNode } from 'react'

import { Surface } from '@/shared/components/ui/surface'

import { SideFeatureSplit } from './SideFeatureSplit'

interface PageWorkspaceProps {
  /** The page, beside the side panel. */
  children: ReactNode
}

/**
 * The side panel and the page, for the screens outside a project, which have no tabs. The side
 * panel is the one of the feature chosen on the activity bar, else of the page on screen, else of
 * the first feature.
 */
export function PageWorkspace({ children }: PageWorkspaceProps) {
  return (
    <SideFeatureSplit>
      <Surface as="main" className="h-full min-w-0">
        {children}
      </Surface>
    </SideFeatureSplit>
  )
}
