'use client'

import { useEffect } from 'react'

import { itemAnchorId } from '@/modules/artifact/entities'

/**
 * Scrolls the block of the item to the middle of the page and gives it the focus, once the
 * document is there; again when the item changes. Does nothing when the block is not there.
 */
export function useScrollToItem(itemId: string | null, { isReady }: { isReady: boolean }) {
  useEffect(() => {
    if (!isReady || itemId === null) return
    const block = document.getElementById(itemAnchorId(itemId))
    block?.scrollIntoView({ block: 'center' })
    block?.focus()
  }, [isReady, itemId])
}
