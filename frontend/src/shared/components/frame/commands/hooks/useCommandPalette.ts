import { useMemo } from 'react'

import { commandGroups } from '../command.utils'
import { useCommandsStore } from '../commands.store'

/**
 * The command palette: whether it is open, the actions that open and close it, and the commands
 * that the components on screen register, by group.
 */
export function useCommandPalette() {
  const open = useCommandsStore((state) => state.open)
  const setOpen = useCommandsStore((state) => state.setOpen)
  const toggle = useCommandsStore((state) => state.toggle)
  const sources = useCommandsStore((state) => state.sources)
  const groups = useMemo(() => commandGroups(sources.values()), [sources])

  return { open, setOpen, toggle, groups }
}
