'use client'

import type { ReactNode } from 'react'

import { Surface } from '@/shared/components/ui/surface'

import { useSideFeature } from '../activities/hooks/useSideFeature'
import { useSidePanelCommand } from '../hooks/useSidePanelCommand'
import { EditorSplit } from '../panels/components/EditorSplit'
import { PanelRegion } from '../panels/panel.constants'

interface PageWorkspaceProps {
  /** The page, beside the side panel. */
  children: ReactNode
}

/**
 * The side panel and the page, for the screens outside a project, which have no tabs. The side
 * panel is the one of the feature chosen on the activity bar or of the page on screen; a page that
 * belongs to no feature, such as the project list, takes the whole room until a feature is chosen.
 * Ctrl+B hides and shows the side panel.
 */
export function PageWorkspace({ children }: PageWorkspaceProps) {
  const { feature } = useSideFeature()

  useSidePanelCommand()

  return (
    <EditorSplit region={PanelRegion.Side} panel={feature?.panel}>
      <Surface as="main" className="h-full min-w-0">
        {children}
      </Surface>
    </EditorSplit>
  )
}
