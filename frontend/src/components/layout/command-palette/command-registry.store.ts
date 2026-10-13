import { create } from 'zustand'

import type { PaletteCommand } from './command.types'

interface CommandRegistryState {
  /** The commands of each component that registers some, in the order the components came. */
  sources: ReadonlyMap<string, readonly PaletteCommand[]>
  setCommands: (source: string, commands: readonly PaletteCommand[]) => void
  removeCommands: (source: string) => void
}

/** The commands of the screen. Components register theirs with `useCommands`. */
export const useCommandRegistryStore = create<CommandRegistryState>()((set) => ({
  sources: new Map(),
  setCommands: (source, commands) => {
    // A source that is already there keeps its place.
    set((state) => ({ sources: new Map(state.sources).set(source, commands) }))
  },
  removeCommands: (source) => {
    set((state) => {
      const sources = new Map(state.sources)
      sources.delete(source)
      return { sources }
    })
  },
}))
