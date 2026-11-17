import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useExportDialogStore } from '../stores/export-dialog.store'

/** Opens the dialog of an export with the key of the template it starts on. */
export function useOpenExportDialog() {
  return useSetPendingAction(useExportDialogStore)
}

/**
 * The dialog that `useOpenExportDialog` opened: its template, whether it is open, and the actions
 * that close it and forget the template once it has closed.
 */
export function useExportDialog() {
  return usePendingAction(useExportDialogStore)
}
