import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The Add link dialog: one on the screen, whatever opens it. It holds the id of the item that the link starts from. */
export const useAddLinkDialogStore = createPendingActionStore()
