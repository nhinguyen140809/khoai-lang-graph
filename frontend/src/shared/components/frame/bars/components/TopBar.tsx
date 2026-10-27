'use client'

import { SearchIcon } from 'lucide-react'
import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'
import { Kbd, KbdGroup } from '@/shared/components/ui/kbd'
import { ariaKeyShortcuts, hotkeyKeys, useModifierKeyName } from '@/shared/lib/hotkey'

import { paletteHotkey } from '../../commands/command.constants'
import { useCommandPalette } from '../../commands/hooks/useCommandPalette'
import { LogoMark } from './LogoMark'

interface TopBarProps {
  /** What follows "khoai /": a page name, or the menu of the current project. */
  crumb: ReactNode
  /** The address of the home page, which the mark and the name of the app lead to. */
  homeHref: Route
}

/** The bar at the top of every screen: the app, where the user is, and search. */
export function TopBar({ crumb, homeHref }: TopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 bg-sidebar px-3 text-sm text-sidebar-foreground">
      <Trail crumb={crumb} homeHref={homeHref} />
      <SearchButton />
      {/* As wide as the trail, so that the search box stays in the middle of the bar. */}
      <div aria-hidden className="flex-1" />
    </header>
  )
}

/** Where the user is: "khoai /", then the crumb. It takes the free width at the left of the bar. */
function Trail({ crumb, homeHref }: TopBarProps) {
  return (
    <Breadcrumb className="min-w-0 flex-1">
      <BreadcrumbList className="flex-nowrap">
        <BreadcrumbItem className="shrink-0">
          <HomeLink href={homeHref} />
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        {/* Bold, as the menu of a project that a crumb can be, which sets its own weight. */}
        <BreadcrumbItem className="min-w-0 font-bold text-foreground">{crumb}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/** The mark and the name of the app, which lead to the home page. */
function HomeLink({ href }: { href: Route }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-md px-1 py-0.5 outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <LogoMark />
      khoai
    </Link>
  )
}

/** Looks like a search box and opens the command palette, as its hotkey does. */
function SearchButton() {
  const { setOpen: setPaletteOpen } = useCommandPalette()
  const modifier = useModifierKeyName()

  return (
    <button
      type="button"
      aria-keyshortcuts={ariaKeyShortcuts(paletteHotkey)}
      onClick={() => {
        setPaletteOpen(true)
      }}
      className="flex h-9 w-md min-w-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-muted-foreground transition-colors outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <SearchIcon aria-hidden className="size-4 shrink-0" />
      <span className="truncate">Search or run a command</span>
      <KbdGroup className="ml-auto" aria-hidden>
        {hotkeyKeys(paletteHotkey, modifier).map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </KbdGroup>
    </button>
  )
}
