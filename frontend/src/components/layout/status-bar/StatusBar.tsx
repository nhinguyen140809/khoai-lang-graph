'use client'

import { BellIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface StatusBarProps {
  /** What the screen reports at the left, such as the run of the project; may be empty. */
  children?: ReactNode
}

/** The bar at the bottom of every screen: what the screen reports, and the notifications. */
export function StatusBar({ children }: StatusBarProps) {
  return (
    <footer className="flex h-6 shrink-0 items-center gap-4 bg-sidebar px-2 text-2xs text-sidebar-foreground">
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-hidden">{children}</div>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex size-5 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-3.5"
          >
            <BellIcon aria-hidden />
            <span className="sr-only">Notifications</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-64 gap-1 p-3">
          <p className="text-xs font-medium">Notifications</p>
          <p className="text-xs text-muted-foreground">Nothing new.</p>
        </PopoverContent>
      </Popover>
    </footer>
  )
}
