import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The Delete dialog of a project: one on the screen, whatever opens it. */
export const useDeleteProjectDialogStore = createPendingActionStore()
