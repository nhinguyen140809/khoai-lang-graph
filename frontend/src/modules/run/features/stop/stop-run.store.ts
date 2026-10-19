import { create } from 'zustand'

interface StopRunState {
  /**
   * The run that the Stop dialog asks about while it is open; null while it is closed. A run that
   * starts later has another id, so the dialog does not open again for it.
   */
  runId: string | null
  ask: (runId: string) => void
  close: () => void
}

/** The Stop dialog of the status: one on the screen, opened by Stop and by the command palette. */
export const useStopRunStore = create<StopRunState>()((set) => ({
  runId: null,
  ask: (runId) => {
    set({ runId })
  },
  close: () => {
    set({ runId: null })
  },
}))
