'use client'

import type { Route } from 'next'
import { usePathname } from 'next/navigation'

import { useSidebar } from '@/shared/components/ui/sidebar'

/**
 * Whether the page of a link of the side list is on show, and what opening the link does: on a
 * narrow screen, where the side list lies over the page, it closes the list.
 */
export function useSidebarLink(href: Route) {
  const isActive = usePathname() === href
  const { isMobile, setOpenMobile } = useSidebar()

  return {
    isActive,
    onOpen: () => {
      if (isMobile) setOpenMobile(false)
    },
  }
}
