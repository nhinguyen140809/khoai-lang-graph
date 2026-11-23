'use client'

import { useState } from 'react'

/**
 * The card of the review that waits, which the chat can bring into view and focus: `attach` is the
 * ref of the card, `hasCard` says whether there is one, and `show` does nothing while there is not.
 */
export function useReviewFocus() {
  const [card, setCard] = useState<HTMLDivElement | null>(null)
  const show = () => {
    card?.scrollIntoView({ block: 'nearest' })
    card?.focus()
  }
  return { attach: setCard, show, hasCard: card !== null }
}
