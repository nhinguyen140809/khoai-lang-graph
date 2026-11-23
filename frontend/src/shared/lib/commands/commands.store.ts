import { create } from 'zustand'

import { removeEntry, setEntry } from '@/shared/lib/collections'

import type { Command } from './command.types'

interface CommandRegistryState {
  /** The commands of each component that registers some, in the order the components came. */
  sources: ReadonlyMap<string, readonly Command[]>
  setCommands: (source: string, commands: readonly Command[]) => void
  removeCommands: (source: string) => void
}

/** The commands of the screen, which components register with `useCommands`. */
export const useCommandRegistry = create<CommandRegistryState>()((set) => ({
  sources: new Map(),
  setCommands: (source, commands) => {
    // A source that is already there keeps its place.
    set((state) => ({ sources: setEntry(state.sources, source, commands) }))
  },
  removeCommands: (source) => {
    set((state) => ({ sources: removeEntry(state.sources, source) }))
  },
}))
