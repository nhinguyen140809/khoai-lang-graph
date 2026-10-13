import { z } from 'zod'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { parseStored, persistStorage, storageKey } from '@/lib/browser-storage.utils'

import { commandNames } from './commands.constants'

// The commands kept for one console; the oldest are dropped past it.
const MAX_COMMANDS = 200

const commandRecordSchema = z.object({
  id: z.string(),
  name: z.enum(commandNames),
  /** When the user ran it, in milliseconds since the epoch. */
  time: z.number(),
})

export type CommandRecord = z.infer<typeof commandRecordSchema>

const persistedHistorySchema = z.object({
  /** The commands of each console by thread id, oldest first. */
  commands: z.record(z.string(), z.array(commandRecordSchema)),
})

type PersistedHistory = z.infer<typeof persistedHistorySchema>

interface CommandHistoryState extends PersistedHistory {
  record: (threadId: string, name: CommandRecord['name']) => void
}

/**
 * The commands that the user ran in each console. The API keeps no record of a command, only of
 * the messages and the runs, so the event log reads them from here; they live on this device.
 * Read the stored state with `rehydrateCommandHistory` after the first render.
 */
export const useCommandHistoryStore = create<CommandHistoryState>()(
  persist(
    (set) => ({
      commands: {},
      record: (threadId, name) => {
        set((state) => {
          const kept = state.commands[threadId] ?? []
          const record = { id: `command-${crypto.randomUUID()}`, name, time: Date.now() }
          return {
            commands: { ...state.commands, [threadId]: [...kept, record].slice(-MAX_COMMANDS) },
          }
        })
      },
    }),
    {
      name: storageKey('command-history'),
      skipHydration: true,
      // Changes are stored only once the stored state has been read.
      storage: persistStorage<PersistedHistory>({
        ready: (): boolean => useCommandHistoryStore.persist.hasHydrated(),
      }),
      partialize: ({ commands }): PersistedHistory => ({ commands }),
      merge: (persisted, current) => {
        const stored = parseStored(persistedHistorySchema, persisted)
        // A command run before the stored ones were read stays after them.
        const commands = { ...stored?.commands }
        for (const [threadId, records] of Object.entries(current.commands)) {
          commands[threadId] = [...(commands[threadId] ?? []), ...records]
        }
        return { ...current, commands }
      },
    },
  ),
)

let rehydrated = false

/** Reads the stored commands once; every part of the console that shows them may call it. */
export function rehydrateCommandHistory() {
  if (rehydrated) return
  rehydrated = true
  void useCommandHistoryStore.persist.rehydrate()
}
