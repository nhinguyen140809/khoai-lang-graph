'use client'

import { useMemo } from 'react'

import { DeskBarSide } from '../desk-bar.types'
import type { DeskTool } from '../desk-tool.types'
import { useDeskBarItem } from '../hooks/useDeskBarItem'
import { useRegisteredDeskTools } from '../hooks/useRegisteredDeskTools'
import { DeskToolButton } from './DeskToolButton'

// Before the items that the pages place at the right of the bar, such as the export.
const toolsOrder = -1

/**
 * Shows the tools of the open project as buttons with their names at the right of the bar, for an
 * arrangement of the desk that keeps them there. It renders nothing in place, and places nothing in
 * the bar while no page offers a tool.
 * @view user
 */
export function DeskToolsInBar() {
  const tools = useRegisteredDeskTools()
  return tools.length === 0 ? null : <ToolsItem tools={tools} />
}

/** The item of the bar that holds the buttons of the tools. */
function ToolsItem({ tools }: { tools: readonly (DeskTool & { key: string })[] }) {
  const content = useMemo(
    () => (
      <>
        {tools.map(({ key, ...tool }) => (
          <DeskToolButton key={key} tool={tool} appearance="named" />
        ))}
      </>
    ),
    [tools],
  )
  useDeskBarItem({ side: DeskBarSide.Right, order: toolsOrder, content })
  return null
}
