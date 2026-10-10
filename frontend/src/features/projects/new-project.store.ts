import { create } from 'zustand'

interface NewProjectDialogState {
  open: boolean
  setOpen: (open: boolean) => void
}

/** Whether the new project dialog is open; the project list and the command palette open it. */
export const useNewProjectDialogStore = create<NewProjectDialogState>()((set) => ({
  open: false,
  setOpen: (open) => {
    set({ open })
  },
}))
