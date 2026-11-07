import { create } from 'zustand'

import type { RunDefaults } from '@/modules/run/entities'

interface ChosenRunSettingsState {
  /** The settings that the user chose for the run that the next message of each thread starts. */
  settingsByThread: Readonly<Record<string, RunDefaults>>
  chooseSettings: (threadId: string, settings: RunDefaults) => void
  clearSettings: (threadId: string) => void
}

/** The settings chosen for the run that the next message of each thread starts; not persisted. */
export const useChosenRunSettingsStore = create<ChosenRunSettingsState>()((set) => ({
  settingsByThread: {},
  chooseSettings: (threadId, settings) => {
    set((state) => ({ settingsByThread: { ...state.settingsByThread, [threadId]: settings } }))
  },
  clearSettings: (threadId) => {
    set((state) => ({
      settingsByThread: Object.fromEntries(
        Object.entries(state.settingsByThread).filter(([id]) => id !== threadId),
      ),
    }))
  },
}))
