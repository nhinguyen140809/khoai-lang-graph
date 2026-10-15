'use client'

import { BellIcon } from 'lucide-react'
import { Fragment } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Stack } from '@/shared/components/ui/stack'

import { useStatusBarItems } from '../hooks/useStatusBarItems'
import { StatusBarSide } from '../status-bar.constants'

/**
 * The bar at the bottom of every screen. The items that components register with
 * `useStatusBarItem` sit in two stacks: the left side, which takes the free width and cuts what
 * does not fit, and the right side, which ends with the notifications.
 */
export function StatusBar() {
  const items = useStatusBarItems()

  return (
    <footer className="flex h-8 shrink-0 items-center gap-4 bg-sidebar px-3 text-xs text-sidebar-foreground">
      <Stack direction="row" gap="4" className="min-w-0 flex-1 overflow-hidden">
        {items[StatusBarSide.Left].map(({ key, content }) => (
          <Fragment key={key}>{content}</Fragment>
        ))}
      </Stack>
      <Stack direction="row" gap="4" className="shrink-0">
        {items[StatusBarSide.Right].map(({ key, content }) => (
          <Fragment key={key}>{content}</Fragment>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex size-7 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4"
            >
              <BellIcon aria-hidden />
              <span className="sr-only">Notifications</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="end" className="w-64 gap-1 p-3">
            <p className="text-sm font-medium">Notifications</p>
            <p className="text-sm text-muted-foreground">Nothing new.</p>
          </PopoverContent>
        </Popover>
      </Stack>
    </footer>
  )
}
