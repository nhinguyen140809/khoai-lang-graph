'use client'

import { PanelLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Surface } from '@/shared/components/ui/surface'

import { usePinSideFeature } from './activities/hooks/usePinSideFeature'
import { useSideFeature } from './activities/hooks/useSideFeature'
import { PaletteGroup } from './commands/command.constants'
import type { PaletteCommand } from './commands/command.types'
import { useCommands } from './commands/hooks/useCommands'
import { useFrameStore } from './frame.store'
import { EditorSplit } from './panels/EditorSplit'
import { PanelRegion } from './panels/panel.constants'
import { projectTabGroup } from './tabs/editor-tabs.store'
import { EditorTabs } from './tabs/EditorTabs'

interface ProjectWorkspaceProps {
  projectId: string
  /** The editor: the page of the tab in view, whichever side panel is shown. */
  children: ReactNode
}

const workspaceCommands: PaletteCommand[] = [
  {
    id: 'view.toggleSidePanel',
    label: 'Toggle side panel',
    group: PaletteGroup.View,
    icon: <PanelLeftIcon />,
    hotkey: { key: 'b', mod: true },
    run: () => {
      useFrameStore.getState().togglePanel(PanelRegion.Side)
    },
  },
]

/**
 * The side panel and the editor. The side panel is the one of the feature chosen on the activity
 * bar, and the editor follows the tabs, so choosing a feature does not change the editor. Ctrl+B
 * hides and shows the side panel, which keeps its width in pixels when the window is resized.
 */
export function ProjectWorkspace({ projectId, children }: ProjectWorkspaceProps) {
  const sideFeature = useSideFeature()
  const group = projectTabGroup(projectId)

  useCommands(workspaceCommands)
  usePinSideFeature(sideFeature?.id)

  return (
    <EditorSplit region={PanelRegion.Side} panel={sideFeature?.panel}>
      <Surface className="flex h-full min-w-0 flex-col">
        <EditorTabs group={group} rootHref={sideFeature?.href} />
        {/* The page fills the editor and scrolls itself: a ScrollArea when its content flows. */}
        <main className="min-h-0 flex-1 editor-text">{children}</main>
      </Surface>
    </EditorSplit>
  )
}
