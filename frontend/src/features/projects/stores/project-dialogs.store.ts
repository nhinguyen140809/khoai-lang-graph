import { create } from 'zustand'

/** A dialog that acts on one project, which a menu, a row of the project list or the palette opens. */
export type ProjectDialog = 'rename' | 'delete'

interface ProjectDialogsState {
  /**
   * The dialog last opened and the id of its project. They stay while the dialog closes, so that it
   * closes with its animation, and go once it has closed.
   */
  dialog: ProjectDialog | null
  projectId: string | null
  open: boolean
  openDialog: (dialog: ProjectDialog, projectId: string) => void
  setOpen: (open: boolean) => void
  closed: () => void
}

/**
 * The dialogs of the projects: one of each on the screen, whatever opens it. The store holds the id
 * of the project only; the dialog reads the project from the queries.
 */
export const useProjectDialogsStore = create<ProjectDialogsState>()((set) => ({
  dialog: null,
  projectId: null,
  open: false,
  openDialog: (dialog, projectId) => {
    set({ dialog, projectId, open: true })
  },
  setOpen: (open) => {
    set({ open })
  },
  closed: () => {
    set({ dialog: null, projectId: null, open: false })
  },
}))
