'use client'

import { PanelLeftIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { useSideFeature } from '../activities/hooks/useSideFeature'
import { PaletteGroup } from '../commands/command.constants'
import { useCommands } from '../commands/hooks/useCommands'
import { EditorSplit } from '../panels/components/EditorSplit'
import { usePanel } from '../panels/hooks/usePanel'
import { PanelRegion } from '../panels/panel.constants'

interface SideFeatureSplitProps {
  /** The editor, or the page of a screen without tabs. */
  children: ReactNode
}

/**
 * The side panel of the feature chosen on the activity bar, and the editor beside it; a screen
 * without features has no side panel, and the editor takes the whole room. Ctrl+B hides and shows
 * the side panel while there is one: without it, the command would only change the stored state of
 * the panel.
 */
export function SideFeatureSplit({ children }: SideFeatureSplitProps) {
  const { feature } = useSideFeature()
  const sidePanel = usePanel(PanelRegion.Side)

  useCommands(
    feature === undefined
      ? []
      : [
          {
            id: 'view.toggleSidePanel',
            label: 'Toggle side panel',
            group: PaletteGroup.View,
            icon: <PanelLeftIcon />,
            hotkey: { key: 'b', mod: true },
            run: sidePanel.toggle,
          },
        ],
  )

  return (
    <EditorSplit region={PanelRegion.Side} panel={feature?.panel}>
      {children}
    </EditorSplit>
  )
}
