'use client'

import { useRegisteredDeskTools } from '../hooks/useRegisteredDeskTools'
import { DeskToolButton } from './DeskToolButton'

/**
 * The rail at the right edge of the desk: the tools of the open project, each an icon with its name
 * in a tooltip. A page that offers no tool has no rail.
 */
export function DeskRail() {
  const tools = useRegisteredDeskTools()
  if (tools.length === 0) return null

  return (
    <nav
      aria-label="Project tools"
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-l px-1.5 py-2"
    >
      {tools.map(({ key, ...tool }) => (
        <DeskToolButton key={key} tool={tool} appearance="icon" />
      ))}
    </nav>
  )
}
