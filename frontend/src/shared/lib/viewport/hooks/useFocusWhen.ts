'use client'

import { type RefObject, useEffect } from 'react'

/**
 * Gives the focus to the element once it is in the page, and again each time `isRequested` turns
 * true, such as when an empty state shows and the next thing to do is to type.
 */
export function useFocusWhen(ref: RefObject<HTMLElement | null>, isRequested: boolean): void {
  useEffect(() => {
    ref.current?.focus()
  }, [ref])

  useEffect(() => {
    if (isRequested) ref.current?.focus()
  }, [ref, isRequested])
}
