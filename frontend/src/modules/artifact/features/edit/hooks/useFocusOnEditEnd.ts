'use client'

import { type RefObject, useEffect } from 'react'

import { useEndedEditingKey, useFocusReturned } from './useEditingRecord'

/**
 * Focuses an element once when the edit mode of a record ends, so that the reader continues from
 * where they started: the Edit button of the record, or the menu button that opened its edit.
 */
export function useFocusOnEditEnd(key: string, ref: RefObject<HTMLElement | null>) {
  const endedKey = useEndedEditingKey()
  const focusReturned = useFocusReturned()

  useEffect(() => {
    if (endedKey === key && ref.current !== null) {
      ref.current.focus()
      focusReturned()
    }
  }, [endedKey, key, focusReturned, ref])
}
