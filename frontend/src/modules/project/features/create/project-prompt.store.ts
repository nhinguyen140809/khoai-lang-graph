import { create } from 'zustand'

interface ProjectPromptState {
  /** Whether the prompt of the project list takes the focus when it shows. */
  focusRequested: boolean
  requestFocus: () => void
  focused: () => void
}

/** The prompt where a project starts: the commands that start a project ask it to take the focus. */
export const useProjectPromptStore = create<ProjectPromptState>()((set) => ({
  focusRequested: false,
  requestFocus: () => {
    set({ focusRequested: true })
  },
  focused: () => {
    set({ focusRequested: false })
  },
}))
