import { createPendingActionStore } from '@/shared/lib/pending-action'

/** The dialog of an export: one on the screen, opened with the key of a template. */
export const useExportDialogStore = createPendingActionStore()
