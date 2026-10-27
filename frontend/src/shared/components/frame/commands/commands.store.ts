import { create } from 'zustand'

import { removeEntry, setEntry } from '@/shared/lib/collections'

import type { PaletteCommand } from './command.types'

interface CommandsState {
  /** Whether the command palette is open. */
  open: boolean
  /** The commands of each component that registers some, in the order the components came. */
  sources: ReadonlyMap<string, readonly PaletteCommand[]>
  setOpen: (open: boolean) => void
  toggle: () => void
  setCommands: (source: string, commands: readonly PaletteCommand[]) => void
  removeCommands: (source: string) => void
}

/**
 * The commands of the screen, which components register with `useCommands`, and whether the
 * palette that lists them is open.
 */
export const useCommandsStore = create<CommandsState>()((set) => ({
  open: false,
  sources: new Map(),
  setOpen: (open) => {
    set({ open })
  },
  toggle: () => {
    set((state) => ({ open: !state.open }))
  },
  setCommands: (source, commands) => {
    // A source that is already there keeps its place.
    set((state) => ({ sources: setEntry(state.sources, source, commands) }))
  },
  removeCommands: (source) => {
    set((state) => ({ sources: removeEntry(state.sources, source) }))
  },
}))
