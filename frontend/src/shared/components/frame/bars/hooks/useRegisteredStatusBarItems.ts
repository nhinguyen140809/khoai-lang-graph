import { useMemo } from 'react'

import { StatusBarSide } from '../status-bar.constants'
import { useStatusBarStore } from '../status-bar.store'
import type { StatusBarItem } from '../status-bar.types'

interface PlacedItem {
  key: string
  content: StatusBarItem['content']
}

/** The items registered with `useStatusBarItem`, by side, in their order. */
export function useRegisteredStatusBarItems(): Record<StatusBarSide, PlacedItem[]> {
  const items = useStatusBarStore((state) => state.items)

  return useMemo(() => {
    const sorted = [...items].sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
    const on = (side: StatusBarSide) =>
      sorted
        .filter(([, item]) => item.side === side)
        .map(([key, { content }]) => ({ key, content }))
    return {
      [StatusBarSide.Left]: on(StatusBarSide.Left),
      [StatusBarSide.Right]: on(StatusBarSide.Right),
    }
  }, [items])
}
