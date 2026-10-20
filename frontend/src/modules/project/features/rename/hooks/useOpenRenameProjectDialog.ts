// The hooks of the store of the Rename dialog: the one that opens it, which the menus, the rows
// and the palette call, and the one that the dialogs of a project read to show it.

import { useShallow } from 'zustand/react/shallow'

import { useRenameProjectDialogStore } from '../rename-project-dialog.store'

/**
 * Opens the Rename dialog of a project from a menu, a row or the command palette. It reads the
 * action only, so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useOpenRenameProjectDialog() {
  return useRenameProjectDialogStore((state) => state.openDialog)
}

/**
 * The Rename dialog that `useOpenRenameProjectDialog` opened: its project, whether it is open, and the
 * actions that close it and forget it once it has closed.
 */
export function useRenameProjectDialog() {
  return useRenameProjectDialogStore(
    useShallow(({ projectId, open, setOpen, closed }) => ({ projectId, open, setOpen, closed })),
  )
}
