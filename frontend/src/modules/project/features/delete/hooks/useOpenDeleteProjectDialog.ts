import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useDeleteProjectDialogStore } from '../delete-project-dialog.store'

/**
 * Opens the Delete dialog of a project from a menu, a row or the command palette. It reads the
 * action only, so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useOpenDeleteProjectDialog() {
  return useSetPendingAction(useDeleteProjectDialogStore)
}

/**
 * The Delete dialog that `useOpenDeleteProjectDialog` opened: its project, whether it is open, and the
 * actions that close it and forget it once it has closed.
 */
export function useDeleteProjectDialog() {
  return usePendingAction(useDeleteProjectDialogStore)
}
