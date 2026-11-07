import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The dialog of the settings of the next run: one on the screen, whatever opens it. */
export const useRunSettingsDialogStore = createPendingActionStore()
