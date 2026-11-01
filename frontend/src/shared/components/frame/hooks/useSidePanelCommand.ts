'use client'

import { PanelLeftIcon } from 'lucide-react'
import { createElement } from 'react'

import { PaletteGroup } from '../commands/command.constants'
import { useCommands } from '../commands/hooks/useCommands'
import { usePanel } from '../panels/hooks/usePanel'
import { PanelRegion } from '../panels/panel.constants'

/** Registers the command that hides and shows the side panel, on Ctrl+B. */
export function useSidePanelCommand() {
  const sidePanel = usePanel(PanelRegion.Side)

  useCommands([
    {
      id: 'view.toggleSidePanel',
      label: 'Toggle side panel',
      group: PaletteGroup.View,
      icon: createElement(PanelLeftIcon),
      hotkey: { key: 'b', mod: true },
      run: sidePanel.toggle,
    },
  ])
}
