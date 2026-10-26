import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The Rename dialog of a project: one on the screen, whatever opens it. */
export const useRenameProjectDialogStore = createPendingActionStore()
