'use client'

import { useEffect } from 'react'

import { recordKeyOf, type RevisionTarget } from '@/modules/artifact/entities'

import { useEditingRecordStore } from '../stores/editing-record.store'

/**
 * Whether the record is in edit mode on its page. The edit mode ends when the page unmounts:
 * leaving through the tree, a tab or `J` and `K` drops the form without asking, as a browser
 * drops a closed tab.
 */
export function useIsEditing(target: RevisionTarget): boolean {
  const isEditing = useEditingRecordStore((state) => state.recordKey === recordKeyOf(target))
  const stopEditing = useEditingRecordStore((state) => state.stopEditing)

  useEffect(() => {
    return () => {
      stopEditing()
    }
  }, [stopEditing])
  return isEditing
}

/** Starts the edit mode of a record, or ends the one that is open. */
export function useEditingActions(): {
  startEditing: (target: RevisionTarget) => void
  stopEditing: () => void
} {
  const startEditing = useEditingRecordStore((state) => state.startEditing)
  const stopEditing = useEditingRecordStore((state) => state.stopEditing)
  return { startEditing, stopEditing }
}

/** Whether a record is in edit mode right now, without ending anything; for a button that hides while its record is edited. */
export function useIsAnyEditing(key: string): boolean {
  return useEditingRecordStore((state) => state.recordKey === key)
}

/** The key of the record whose edit mode just ended, which its Edit button takes the focus back from. */
export function useEndedEditingKey(): string | null {
  return useEditingRecordStore((state) => state.endedKey)
}

/** Says that the Edit button of `endedKey` took the focus back. */
export function useFocusReturned() {
  return useEditingRecordStore((state) => state.focusReturned)
}
