'use client'

import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { Kbd, KbdGroup } from '@/components/ui/kbd'

import { useCommandPaletteStore } from './command-palette.store'

interface TopBarProps {
  /** What follows "khoai /": a page name, or the menu of the current project. */
  crumb: ReactNode
}

/** The bar at the top of every screen: the app, where the user is, and search. */
export function TopBar({ crumb }: TopBarProps) {
  const setPaletteOpen = useCommandPaletteStore((state) => state.setOpen)

  return (
    <header className="grid h-10 shrink-0 grid-cols-[1fr_minmax(0,28rem)_1fr] items-center gap-3 bg-sidebar px-2 text-xs text-sidebar-foreground">
      <div className="flex min-w-0 items-center gap-1.5">
        <Link
          href="/projects"
          className="flex shrink-0 items-center gap-2 rounded-md px-1 py-0.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="flex size-4 items-center justify-center rounded-[0.1875rem] bg-primary text-[0.5625rem] leading-none font-semibold text-primary-foreground"
          >
            K
          </span>
          <span className="text-muted-foreground">khoai</span>
        </Link>
        <span aria-hidden className="text-muted-foreground">
          /
        </span>
        <div className="flex min-w-0 items-center font-medium text-foreground">{crumb}</div>
      </div>
      <button
        type="button"
        aria-keyshortcuts="Control+K Meta+K"
        onClick={() => {
          setPaletteOpen(true)
        }}
        className="flex h-7 w-full min-w-0 items-center gap-2 rounded-md border border-input bg-background px-2 text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <SearchIcon aria-hidden className="size-3.5 shrink-0" />
        <span className="truncate">Search or run a command</span>
        <KbdGroup className="ml-auto" aria-hidden>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </button>
      <div aria-hidden />
    </header>
  )
}
