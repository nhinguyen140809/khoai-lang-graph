'use client'

import { BrandLink } from '@/shared/components/brand'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

import { DeskBar } from '../../bars/components/DeskBar'
import { DeskRail } from '../../bars/components/DeskRail'
import { SearchButton } from '../../bars/components/SearchButton'
import { CommandPalette } from '../../palette/components/CommandPalette'
import type { DeskFrameProps } from '../desk-frame.types'

/**
 * The studio arrangement of the desk: the bar at the top, with the name of the app and the items
 * that the pages place at its left, the search in the middle, and the items at its right with the
 * account at the end; under it the page, which has the whole width, and at the right edge the rail
 * of the tools of the open project (`DeskRail`), whose tools open beside the page. There is no side
 * list: the projects are on the start page.
 * @view user
 */
export function StudioFrame({ homeHref, accountMenu, contributions, children }: DeskFrameProps) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b px-3">
        <DeskBar
          leading={<BrandLink href={homeHref} className="shrink-0 text-sm" />}
          divider={
            <span aria-hidden className="-mx-1 shrink-0 text-muted-foreground/60 select-none">
              /
            </span>
          }
          center={<SearchButton />}
          trailing={accountMenu}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        {/* Every page scrolls here, so no page makes a scroll area of its own: a page taller than
            this scrolls it, and a page that fills its height keeps the scrolling of its own parts. */}
        <main className="min-h-0 min-w-0 flex-1">
          <ScrollArea fillContent className="h-full">
            <div className="flex h-full flex-col">{children}</div>
          </ScrollArea>
        </main>
        <DeskRail />
      </div>
      <CommandPalette />
      {contributions}
    </div>
  )
}
