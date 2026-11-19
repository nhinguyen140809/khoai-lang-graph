'use client'

import { useSidebar } from '@/shared/components/ui/sidebar'

import type { SidebarLayout } from '../sidebar.types'

/**
 * How the side list shows now, for the parts that lay themselves out by it: `expanded` while it is
 * open, or lies over the page on a narrow screen, where it is always open; `rail` once it is folded
 * on a wide screen. A part picks its layout from a record keyed by this, instead of branching.
 */
export function useSidebarLayout(): SidebarLayout {
  const { isMobile, state } = useSidebar()
  return isMobile || state === 'expanded' ? 'expanded' : 'rail'
}
