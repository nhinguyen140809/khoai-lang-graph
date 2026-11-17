'use client'

import { ErrorBoundary } from 'react-error-boundary'

import { Stack } from '@/shared/components/ui/stack'

import { DeskBarSide } from '../desk-bar.types'
import { useRegisteredDeskBarItems } from '../hooks/useRegisteredDeskBarItems'

/**
 * The bar at the top of the desk: the items that the pages register with `useDeskBarItem`, in two
 * stacks, the left side, which takes the free width and cuts what does not fit, and the right side.
 * A page that registers nothing has no bar. An item that fails to render leaves the bar, not the
 * page, and comes back when it registers a new content.
 */
export function DeskBar() {
  const items = useRegisteredDeskBarItems()
  if (items[DeskBarSide.Left].length === 0 && items[DeskBarSide.Right].length === 0) return null

  return (
    <header className="flex h-12 min-w-0 flex-1 items-center gap-2">
      <Stack direction="row" gap="1" className="min-w-0 flex-1 overflow-hidden">
        {items[DeskBarSide.Left].map(({ key, content }) => (
          <ErrorBoundary key={key} fallback={null} resetKeys={[content]}>
            {content}
          </ErrorBoundary>
        ))}
      </Stack>
      <Stack direction="row" gap="1" className="shrink-0">
        {items[DeskBarSide.Right].map(({ key, content }) => (
          <ErrorBoundary key={key} fallback={null} resetKeys={[content]}>
            {content}
          </ErrorBoundary>
        ))}
      </Stack>
    </header>
  )
}
