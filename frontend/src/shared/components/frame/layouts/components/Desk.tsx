'use client'

import type { Route } from 'next'
import type { CSSProperties, ReactNode } from 'react'

import { BrandLink, LogoMark } from '@/shared/components/brand'
import {
  Sidebar,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from '@/shared/components/ui/sidebar'

import { DeskBar } from '../../bars/components/DeskBar'
import { CommandPalette } from '../../commands/components/CommandPalette'
import { SidebarEdge } from '../../sidebar/components/SidebarEdge'
import { SidebarToggle } from '../../sidebar/components/SidebarToggle'
import { useResizableSidebar } from '../../sidebar/hooks/useResizableSidebar'

interface DeskProps {
  /**
   * The side list under its first row, top to bottom: what starts new work, the sections, the
   * account. It fills the `Sidebar`, so it is built from the parts of `@/shared/components/ui/sidebar`.
   */
  sidebar: ReactNode
  /** The address of the home page, which the name of the app leads to. */
  homeHref: Route
  /** Components that render nothing in place: dialogs mounted once. */
  contributions?: ReactNode
  /** The page on show. */
  children: ReactNode
}

/**
 * The desk, the frame of the user view: a side list at the left and the page beside it, which
 * fills the rest of the window, under the bar at the top of the desk (`DeskBar`), where the pages
 * place their items with `useDeskBarItem` or `DeskBarItem`; a page that places none has no bar. The first row of the side list holds
 * the button that folds it and the name of the app. The edge of the side list resizes it when
 * dragged, and folds it to a rail of icons once dragged well past its narrowest width
 * (`useResizableSidebar`); folded, the button keeps its place at the top left. On a phone the side
 * list is never a rail: it opens over the page from a button at the top left of the page. The desk names no object of the product: what
 * the side list holds, the items of the bar and the dialogs come from the modules.
 */
export function Desk({ sidebar, homeHref, contributions, children }: DeskProps) {
  const { isOpen, setOpen, width, isResizing, edgeProps } = useResizableSidebar()

  return (
    <SidebarProvider
      open={isOpen}
      onOpenChange={setOpen}
      // While the edge is dragged, the side list follows the pointer without its motion.
      data-resizing={isResizing ? '' : undefined}
      style={{ '--sidebar-width': `${String(width)}px` } as CSSProperties}
      className="h-svh overflow-hidden data-resizing:select-none data-resizing:**:transition-none"
    >
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex-row items-center gap-1">
          {/* Folded to its rail, the button shows the mark of the app, and the icon when pointed at. */}
          <SidebarToggle restingMark={<LogoMark className="size-5" />} />
          <BrandLink
            href={homeHref}
            display="name"
            className="text-lg font-semibold tracking-tight group-data-[collapsible=icon]:hidden"
          />
        </SidebarHeader>
        {sidebar}
        <SidebarEdge {...edgeProps} />
      </Sidebar>
      <SidebarInset className="min-h-0 min-w-0">
        {/*
          The top of the page. On a phone, where the side list opens over the page, it starts with
          the button that opens it, at the top left, and the bar follows when the page has one; on
          a wider screen it holds the bar alone, and takes no height without one.
        */}
        <div className="flex shrink-0 items-center gap-2 border-sidebar-border px-2 max-md:h-12 max-md:border-b md:has-[header]:border-b">
          <SidebarToggle className="md:hidden" />
          <DeskBar />
        </div>
        {/* The page fills the rest of the height and scrolls on its own. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</div>
      </SidebarInset>
      <CommandPalette />
      {contributions}
    </SidebarProvider>
  )
}
