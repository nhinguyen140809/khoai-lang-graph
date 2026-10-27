import { useMemo } from 'react'

import { useRegisteredItems } from '@/shared/lib/registry'

import { useStatusBarStore } from '../status-bar.store'
import { type StatusBarItem, StatusBarSide } from '../status-bar.types'

interface PlacedItem {
  key: string
  content: StatusBarItem['content']
}

/** The items registered with `useStatusBarItem`, by side, in their order. */
export function useRegisteredStatusBarItems(): Record<StatusBarSide, PlacedItem[]> {
  const items = useRegisteredItems(useStatusBarStore)

  return useMemo(() => {
    const on = (side: StatusBarSide) =>
      items.filter((item) => item.side === side).map(({ key, content }) => ({ key, content }))
    return {
      [StatusBarSide.Left]: on(StatusBarSide.Left),
      [StatusBarSide.Right]: on(StatusBarSide.Right),
    }
  }, [items])
}
