// The hooks of the store of the project dialogs: the one that opens a dialog, which the menus, the
// rows and the palette call, and the one that `ProjectDialogs` reads to show it.

import { useShallow } from 'zustand/react/shallow'

import { useProjectDialogsStore } from '../stores/project-dialogs.store'

/**
 * Opens a dialog of a project, Rename or Delete, from a menu, a row or the command palette. The
 * dialog is the one that `ProjectDialogs` shows, so that the screen has one of each. It reads the
 * action only, so that the parts that open a dialog do not render again when one opens or closes.
 */
export function useOpenProjectDialog() {
  return useProjectDialogsStore((state) => state.openDialog)
}

/**
 * The dialog of a project that `useOpenProjectDialog` opened, for `ProjectDialogs`, which shows it:
 * the dialog and its project, whether it is open, and the actions that close it and forget it once
 * it has closed.
 */
export function useProjectDialog() {
  return useProjectDialogsStore(
    useShallow(({ dialog, projectId, open, setOpen, closed }) => ({
      dialog,
      projectId,
      open,
      setOpen,
      closed,
    })),
  )
}
