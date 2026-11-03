import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useDiscardChangesDialogStore } from '../stores/discard-changes-dialog.store'

/** Opens the dialog that asks before the changes of a form are dropped, from the Cancel of a dirty form. */
export function useOpenDiscardChangesDialog() {
  return useSetPendingAction(useDiscardChangesDialogStore)
}

/** The dialog of the discarded changes: its target, whether it is open, and the actions that close it. */
export function useDiscardChangesDialog() {
  return usePendingAction(useDiscardChangesDialogStore)
}
