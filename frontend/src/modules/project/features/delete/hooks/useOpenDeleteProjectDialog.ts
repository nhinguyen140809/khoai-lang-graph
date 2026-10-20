// The hooks of the store of the Delete dialog: the one that opens it, which the menus, the rows
// and the palette call, and the one that the dialogs of a project read to show it.

import { useShallow } from 'zustand/react/shallow'

import { useDeleteProjectDialogStore } from '../delete-project-dialog.store'

/**
 * Opens the Delete dialog of a project from a menu, a row or the command palette. It reads the
 * action only, so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useOpenDeleteProjectDialog() {
  return useDeleteProjectDialogStore((state) => state.openDialog)
}

/**
 * The Delete dialog that `useOpenDeleteProjectDialog` opened: its project, whether it is open, and the
 * actions that close it and forget it once it has closed.
 */
export function useDeleteProjectDialog() {
  return useDeleteProjectDialogStore(
    useShallow(({ projectId, open, setOpen, closed }) => ({ projectId, open, setOpen, closed })),
  )
}
