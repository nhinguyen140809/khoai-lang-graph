'use client'

import { BrandLink } from '@/shared/components/brand'

import { DeskBar } from '../../bars/components/DeskBar'
import { DeskRail } from '../../bars/components/DeskRail'
import { SearchButton } from '../../bars/components/SearchButton'
import { CommandPalette } from '../../commands/components/CommandPalette'
import type { DeskFrameProps } from '../desk-frame.types'

/**
 * The studio arrangement of the desk: the bar at the top, with the name of the app and the items
 * that the pages place at its left, the search in the middle, and the items at its right with the
 * account at the end; under it the page, which has the whole width, and at the right edge the rail
 * of the tools of the open project (`DeskRail`), whose tools open beside the page. There is no side
 * list: the projects are on the start page.
 */
export function StudioFrame({ homeHref, accountMenu, contributions, children }: DeskFrameProps) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b px-3">
        <DeskBar
          leading={<BrandLink href={homeHref} className="mr-2 shrink-0" />}
          center={<SearchButton />}
          trailing={accountMenu}
        />
      </div>
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto">{children}</main>
        <DeskRail />
      </div>
      <CommandPalette />
      {contributions}
    </div>
  )
}
