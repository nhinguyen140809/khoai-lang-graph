'use client'

import { useEffect, useState } from 'react'

/** How long a card chosen in the search stays marked, in milliseconds. */
const focusDuration = 2000

/** The card that the search chose, which stays marked for a moment and then clears. */
export function useCardFocus(): [string | null, (id: string) => void] {
  const [focused, setFocused] = useState<string | null>(null)

  useEffect(() => {
    if (focused === null) return
    const timer = setTimeout(() => {
      setFocused(null)
    }, focusDuration)
    return () => {
      clearTimeout(timer)
    }
  }, [focused])

  return [focused, setFocused]
}
