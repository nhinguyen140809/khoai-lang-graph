import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The dialog that restores a version of a record; its target is the key of the version, such as `item:<id>@2`. */
export const useRestoreVersionDialogStore = createPendingActionStore()
