import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The Stop dialog of a run: one on the screen, whatever opens it. */
export const useStopRunDialogStore = createPendingActionStore()
