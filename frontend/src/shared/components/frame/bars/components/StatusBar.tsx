'use client'

import { BellIcon } from 'lucide-react'
import { ErrorBoundary } from 'react-error-boundary'

import { Button } from '@/shared/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Stack } from '@/shared/components/ui/stack'

import { useRegisteredStatusBarItems } from '../hooks/useRegisteredStatusBarItems'
import { StatusBarSide } from '../status-bar.constants'

/**
 * The bar at the bottom of every screen. The items that components register with
 * `useStatusBarItem` sit in two stacks: the left side, which takes the free width and cuts what
 * does not fit, and the right side, which ends with the notifications. An item that fails to
 * render leaves the bar, not the screen, and comes back when it registers a new content.
 */
export function StatusBar() {
  const items = useRegisteredStatusBarItems()

  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 bg-sidebar px-3 text-xs text-sidebar-foreground">
      <Stack direction="row" gap="4" className="min-w-0 flex-1 overflow-hidden">
        {items[StatusBarSide.Left].map(({ key, content }) => (
          <ErrorBoundary key={key} fallback={null} resetKeys={[content]}>
            {content}
          </ErrorBoundary>
        ))}
      </Stack>
      <Stack direction="row" gap="4" className="shrink-0">
        {items[StatusBarSide.Right].map(({ key, content }) => (
          <ErrorBoundary key={key} fallback={null} resetKeys={[content]}>
            {content}
          </ErrorBoundary>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
              <BellIcon aria-hidden />
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 gap-1 p-3">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-sm text-muted-foreground">Nothing new.</p>
          </PopoverContent>
        </Popover>
      </Stack>
    </footer>
  )
}
