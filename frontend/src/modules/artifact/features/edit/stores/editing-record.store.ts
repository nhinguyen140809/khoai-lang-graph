import { create } from 'zustand'

import type { RevisionTarget } from '@/modules/artifact/entities'
import { recordKeyOf } from '@/modules/artifact/entities'

/** Which record is being edited on its page, and whose Edit button takes the focus back. */
interface EditingRecordState {
  /** The key of the record in edit mode (`item:<id>` or `artifact:<id>`); null when none is. */
  recordKey: string | null
  /** The key of the record whose edit mode just ended, so that its Edit button takes the focus. */
  endedKey: string | null
  startEditing: (target: RevisionTarget) => void
  stopEditing: () => void
  /** Says that the Edit button of `endedKey` took the focus back. */
  focusReturned: () => void
}

export const useEditingRecordStore = create<EditingRecordState>()((set) => ({
  recordKey: null,
  endedKey: null,
  startEditing: (target) => {
    set({ recordKey: recordKeyOf(target), endedKey: null })
  },
  stopEditing: () => {
    set((state) => ({ recordKey: null, endedKey: state.recordKey }))
  },
  focusReturned: () => {
    set({ endedKey: null })
  },
}))
