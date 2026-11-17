import { clamp } from '@/shared/lib/numbers'

import type { SidebarSize, SidebarWidths } from './sidebar.types'

/** `width` held between the narrowest and the widest width of the side list, in whole pixels. */
export function clampSidebarWidth(width: number, widths: SidebarWidths): number {
  return Math.round(clamp(width, widths))
}

/**
 * The side list while its edge is dragged, with the pointer `pointerWidth` pixels from its left
 * side: folded to its rail when the pointer is nearer than `foldBelow`, otherwise open and as wide
 * as the pointer, between its narrowest and its widest width. Dragged back past `foldBelow`, it
 * opens again, at its narrowest width at least.
 */
export function sidebarSizeAt(pointerWidth: number, widths: SidebarWidths): SidebarSize {
  if (pointerWidth < widths.foldBelow) return { open: false }
  return { open: true, width: clampSidebarWidth(pointerWidth, widths) }
}
