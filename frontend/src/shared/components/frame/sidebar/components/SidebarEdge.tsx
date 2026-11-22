'use client'

import type { ComponentProps } from 'react'

import { SidebarRail, useSidebar } from '@/shared/components/ui/sidebar'

import { sidebarMessages } from '../sidebar.constants'

/**
 * The edge of the side list, which takes the props of `useResizableSidebar`: a drag resizes the
 * side list and a click folds or opens it, as its name says. On a phone the side list opens over
 * the page and is never resized, so the edge is not there.
 */
export function SidebarEdge(
  props: Omit<ComponentProps<typeof SidebarRail>, 'aria-label' | 'title'>,
) {
  const { isMobile, open } = useSidebar()
  if (isMobile) return null

  const label = open ? sidebarMessages.resizeOpenSidebar : sidebarMessages.resizeFoldedSidebar
  return <SidebarRail {...props} aria-label={label} title={label} />
}
