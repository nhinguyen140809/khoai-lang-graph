'use client'

import type { Route } from 'next'
import type { ReactNode } from 'react'

import { BrandLink } from '@/shared/components/brand'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb'

import { SearchButton } from './SearchButton'

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
          <BrandLink href={homeHref} className="py-0.5" />
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        {/* Bold, as the menu of a project that a crumb can be, which sets its own weight. */}
        <BreadcrumbItem className="min-w-0 font-bold text-foreground">{crumb}</BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
