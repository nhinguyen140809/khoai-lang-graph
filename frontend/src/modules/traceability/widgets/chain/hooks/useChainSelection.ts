'use client'

import { useCallback, useState } from 'react'

/**
 * The link chosen on the graph, whose quoted words show in its two nodes; null when none is.
 * The selection clears on a click elsewhere, on Escape, on a node, or moves to another link.
 */
export function useChainSelection(): {
  selectedLinkId: string | null
  select: (linkId: string) => void
  clear: () => void
} {
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)
  const select = useCallback((linkId: string) => {
    setSelectedLinkId(linkId)
  }, [])
  const clear = useCallback(() => {
    setSelectedLinkId(null)
  }, [])
  return { selectedLinkId, select, clear }
}
