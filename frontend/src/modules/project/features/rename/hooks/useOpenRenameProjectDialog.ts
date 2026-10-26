import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useRenameProjectDialogStore } from '../rename-project-dialog.store'

/**
 * Opens the Rename dialog of a project from a menu, a row or the command palette. It reads the
 * action only, so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useOpenRenameProjectDialog() {
  return useSetPendingAction(useRenameProjectDialogStore)
}

/**
 * The Rename dialog that `useOpenRenameProjectDialog` opened: its project, whether it is open, and the
 * actions that close it and forget it once it has closed.
 */
export function useRenameProjectDialog() {
  return usePendingAction(useRenameProjectDialogStore)
}
