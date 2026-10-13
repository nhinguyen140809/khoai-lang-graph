'use client'

import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import { useModifierKeyName } from '@/shared/hooks/useModifierKeyName'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb'
import { Kbd, KbdGroup } from '@/shared/ui/kbd'

import { paletteHotkey } from '../commands/command.constants'
import { ariaKeyShortcuts, hotkeyKeys } from '../commands/command.utils'
import { useCommandPaletteStore } from '../commands/command-palette.store'

interface TopBarProps {
  /** What follows "khoai /": a page name, or the menu of the current project. */
  crumb: ReactNode
}

/** The bar at the top of every screen: the app, where the user is, and search. */
export function TopBar({ crumb }: TopBarProps) {
  return (
    <header className="flex h-10 shrink-0 items-center gap-3 bg-sidebar px-2 text-xs text-sidebar-foreground">
      <Trail crumb={crumb} />
      <SearchButton />
      {/* As wide as the trail, so that the search box stays in the middle of the bar. */}
      <div aria-hidden className="flex-1" />
    </header>
  )
}

/** Where the user is: "khoai /", then the crumb. It takes the free width at the left of the bar. */
function Trail({ crumb }: TopBarProps) {
  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          <HomeLink />
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem className="min-w-0 font-medium text-foreground">{crumb}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** The mark and the name of the app, which lead to the home page. */
function HomeLink() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-md px-1 py-0.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <span
        aria-hidden
        className="flex size-4 items-center justify-center rounded-sm bg-primary text-4xs leading-none font-semibold text-primary-foreground"
      >
        K
      </span>
      khoai
    </Link>
  )
}

/** Looks like a search box and opens the command palette, as its hotkey does. */
function SearchButton() {
  const setPaletteOpen = useCommandPaletteStore((state) => state.setOpen)
  const modifier = useModifierKeyName()

  return (
    <button
      type="button"
      aria-keyshortcuts={ariaKeyShortcuts(paletteHotkey)}
      onClick={() => {
        setPaletteOpen(true)
      }}
      className="flex h-7 w-md min-w-0 items-center gap-2 rounded-md border border-input bg-background px-2 text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <SearchIcon aria-hidden className="size-3.5 shrink-0" />
      <span className="truncate">Search or run a command</span>
      <KbdGroup className="ml-auto" aria-hidden>
        {hotkeyKeys(paletteHotkey, modifier).map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
    </button>
  )
}
