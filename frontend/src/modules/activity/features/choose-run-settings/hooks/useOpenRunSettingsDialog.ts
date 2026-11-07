import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useRunSettingsDialogStore } from '../stores/run-settings-dialog.store'

/** Opens the dialog of the settings of the next run of a thread. */
export function useOpenRunSettingsDialog() {
  return useSetPendingAction(useRunSettingsDialogStore)
}

/**
 * The dialog of the settings of the next run that `useOpenRunSettingsDialog` opened: the thread it
 * changes, whether it is open, and the actions that close it and forget it once it has closed.
 */
export function useRunSettingsDialog() {
  return usePendingAction(useRunSettingsDialogStore)
}
