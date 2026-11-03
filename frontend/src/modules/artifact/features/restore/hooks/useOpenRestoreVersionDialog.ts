import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useRestoreVersionDialogStore } from '../restore-version-dialog.store'

/** Opens the dialog that restores a version of a record, from the slot of the history surface. */
export function useOpenRestoreVersionDialog() {
  return useSetPendingAction(useRestoreVersionDialogStore)
}

/** The dialog of a restore: its target, whether it is open, and the actions that close it. */
export function useRestoreVersionDialog() {
  return usePendingAction(useRestoreVersionDialogStore)
}
