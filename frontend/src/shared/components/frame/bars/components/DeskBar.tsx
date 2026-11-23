'use client'

import { cn } from 'cn'
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { Stack } from '@/shared/components/ui/stack'

import { DeskBarSide } from '../desk-bar.types'
import { useRegisteredDeskBarItems } from '../hooks/useRegisteredDeskBarItems'

interface DeskBarProps {
  /** What stands before the items of the left side, such as the name of the app. */
  leading?: ReactNode
  /** What stands between `leading` and the items of the left side, shown only when that side has items, such as a slash. */
  divider?: ReactNode
  /** What stands in the middle of the bar, such as the search; the two sides then share the rest of the width. */
  center?: ReactNode
  /** What stands after the items of the right side, such as the account. */
  trailing?: ReactNode
}

/**
 * The bar at the top of the desk: the items that the pages register with `useDeskBarItem`, in two
 * stacks, the left side, which takes the free width and cuts what does not fit, and the right side.
 * A page that registers nothing has no bar, unless the arrangement of the desk brings `leading`,
 * `center` or `trailing` of its own. An item that fails to render leaves the bar, not the
 * page, and comes back when it registers a new content.
 */
export function DeskBar({ leading, divider, center, trailing }: DeskBarProps) {
  const items = useRegisteredDeskBarItems()
  const hasParts = leading !== undefined || center !== undefined || trailing !== undefined
  if (!hasParts && items[DeskBarSide.Left].length === 0 && items[DeskBarSide.Right].length === 0) {
    return null
  }

  return (
    <header className="flex h-12 min-w-0 flex-1 items-center gap-2">
      {leading}
      {items[DeskBarSide.Left].length > 0 && divider}
      <Stack direction="row" gap="2" className="min-w-0 flex-1 overflow-hidden">
        <BarItems items={items[DeskBarSide.Left]} />
      </Stack>
      {center}
      <Stack
        direction="row"
        gap="2"
        className={cn('shrink-0', center !== undefined && 'flex-1 justify-end')}
      >
        <BarItems items={items[DeskBarSide.Right]} />
        {trailing}
      </Stack>
    </header>
  )
}

/** The items of one side, each alone in a boundary, so that one that fails does not take the rest. */
function BarItems({ items }: { items: ReturnType<typeof useRegisteredDeskBarItems>[DeskBarSide] }) {
  return items.map(({ key, content }) => (
    <ErrorBoundary key={key} fallback={null} resetKeys={[content]}>
      {content}
    </ErrorBoundary>
  ))
}
