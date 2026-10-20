import { create } from 'zustand'

interface DeleteProjectDialogState {
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
 * The Delete dialog of a project: one on the screen, whatever opens it. The store holds the id of
 * the project only; the dialog reads the project from the queries.
 */
export const useDeleteProjectDialogStore = create<DeleteProjectDialogState>()((set) => ({
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
