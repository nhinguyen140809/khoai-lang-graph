import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useStopRunDialogStore } from '../stop-run-dialog.store'

/**
 * Opens the Stop dialog of a run from its button or the command palette. It reads the action
 * only, so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useOpenStopRunDialog() {
  return useSetPendingAction(useStopRunDialogStore)
}

/**
 * The Stop dialog that `useOpenStopRunDialog` opened: its run, whether it is open, and the actions
 * that close it and forget it once it has closed.
 */
export function useStopRunDialog() {
  return usePendingAction(useStopRunDialogStore)
}
