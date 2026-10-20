import { useMemo } from 'react'

import { useActivityBarStore } from '../activity-bar.store'
import type { ActivityBarItem } from '../destination.types'

interface PlacedItem {
  key: string
  content: ActivityBarItem['content']
}

/** The items registered with `useActivityBarItem`, in their order. */
export function useRegisteredActivityBarItems(): PlacedItem[] {
  const items = useActivityBarStore((state) => state.items)

  return useMemo(
    () =>
      [...items]
        .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
        .map(([key, { content }]) => ({ key, content })),
    [items],
  )
}
