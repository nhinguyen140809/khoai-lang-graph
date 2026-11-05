import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The dialog that asks before the changes of a form are dropped; its target is the key of the record being edited. */
export const useDiscardChangesDialogStore = createPendingActionStore()
