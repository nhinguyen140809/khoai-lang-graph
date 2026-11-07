'use client'

import { useEffect } from 'react'

/**
 * Scrolls the element that `id` names into view once `isReady`, and again each time `id` changes:
 * `nearest` moves the scroll area only as far as it needs, `center` puts the element in its
 * middle. With `focus`, the element takes the focus too. An element that is not in the page yet is
 * scrolled to when it appears, as a deep link needs before its entries have loaded.
 */
export function useScrollIntoViewById(
  id: string | null,
  {
    block = 'nearest',
    focus = false,
    isReady = true,
  }: { block?: 'nearest' | 'center'; focus?: boolean; isReady?: boolean } = {},
): void {
  useEffect(() => {
    if (!isReady || id === null) return

    const scroll = (element: HTMLElement) => {
      element.scrollIntoView({ block })
      if (focus) element.focus()
    }

    const element = document.getElementById(id)
    if (element !== null) {
      scroll(element)
      return
    }

    const observer = new MutationObserver(() => {
      const appeared = document.getElementById(id)
      if (appeared === null) return
      scroll(appeared)
      observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
    }
  }, [id, isReady, block, focus])
}
