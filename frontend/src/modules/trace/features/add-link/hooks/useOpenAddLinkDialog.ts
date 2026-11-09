import { usePendingAction, useSetPendingAction } from '@/shared/lib/pending-action'

import { useAddLinkDialogStore } from '../add-link.store'

/**
 * Opens the Add link dialog from a menu, for the item that the link starts from. It reads the
 * action only, so that the parts that open the dialog do not render again when it opens or closes.
 */
export function useOpenAddLinkDialog() {
  return useSetPendingAction(useAddLinkDialogStore)
}

/**
 * The Add link dialog that `useOpenAddLinkDialog` opened: the id of the item that the link starts
 * from, whether it is open, and the actions that close it and forget it once it has closed.
 */
export function useAddLinkDialog() {
  return usePendingAction(useAddLinkDialogStore)
}
