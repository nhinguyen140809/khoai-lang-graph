import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The Remove link dialog: one on the screen, whatever opens it. It holds the key of `linkKeyOf`, which names the item and the link. */
export const useRemoveLinkDialogStore = createPendingActionStore()
