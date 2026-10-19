import { create } from 'zustand'

interface RenameProjectDialogState {
  /**
   * The project of the dialog, while it is open. It stays while the dialog closes, so that it closes
   * with its animation, and goes once it has closed.
   */
  projectId: string | null
  open: boolean
  openDialog: (projectId: string) => void
  setOpen: (open: boolean) => void
  closed: () => void
}

/**
 * The Rename dialog of a project: one on the screen, whatever opens it. The store holds the id of
 * the project only; the dialog reads the project from the queries.
 */
export const useRenameProjectDialogStore = create<RenameProjectDialogState>()((set) => ({
  projectId: null,
  open: false,
  openDialog: (projectId) => {
    set({ projectId, open: true })
  },
  setOpen: (open) => {
    set({ open })
  },
  closed: () => {
    set({ projectId: null, open: false })
  },
}))
