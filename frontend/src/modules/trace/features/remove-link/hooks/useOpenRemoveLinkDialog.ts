import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useRemoveLinkDialogStore } from '../remove-link.store'

/** Opens the Remove link dialog from a menu, for the key of `linkKeyOf` that names the item and the link. */
export function useOpenRemoveLinkDialog() {
  return useSetPendingAction(useRemoveLinkDialogStore)
}

/**
 * The Remove link dialog that `useOpenRemoveLinkDialog` opened: the key that names the item and
 * the link, whether it is open, and the actions that close it and forget it once it has closed.
 */
export function useRemoveLinkDialog() {
  return usePendingAction(useRemoveLinkDialogStore)
}
