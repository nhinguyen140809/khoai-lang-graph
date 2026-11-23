import { useMemo } from 'react'

import { useCommandRegistry } from '@/shared/lib/commands'

import { usePaletteStore } from '../palette.store'
import { commandGroups } from '../palette.utils'

/**
 * The command palette: whether it is open, the actions that open and close it, and the commands
 * that the components on screen register, by group.
 */
export function useCommandPalette() {
  const isOpen = usePaletteStore((state) => state.open)
  const setOpen = usePaletteStore((state) => state.setOpen)
  const toggle = usePaletteStore((state) => state.toggle)
  const sources = useCommandRegistry((state) => state.sources)
  const groups = useMemo(() => commandGroups(sources.values()), [sources])

  return { open: isOpen, setOpen, toggle, groups }
}
