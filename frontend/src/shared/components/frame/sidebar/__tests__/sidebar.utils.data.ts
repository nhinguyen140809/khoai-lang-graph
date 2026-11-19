import type { SidebarSize, SidebarWidths } from '../sidebar.types'

/** The widths of a side list in the cases, apart from those of the app. */
export const widths: SidebarWidths = { initial: 256, min: 200, max: 400, foldBelow: 120 }

/** Where the pointer drags the edge, from the left side of the side list, and the side list then. */
export const sizeCases: { name: string; pointerWidth: number; expected: SidebarSize }[] = [
  { name: 'open as wide as the pointer', pointerWidth: 300, expected: { open: true, width: 300 } },
  { name: 'open at a whole width', pointerWidth: 300.6, expected: { open: true, width: 301 } },
  {
    name: 'open at its narrowest past it, before the fold',
    pointerWidth: 150,
    expected: { open: true, width: 200 },
  },
  {
    name: 'open at its narrowest at the fold itself',
    pointerWidth: 120,
    expected: { open: true, width: 200 },
  },
  { name: 'folded nearer than the fold', pointerWidth: 119, expected: { open: false } },
  { name: 'folded at its left side', pointerWidth: 0, expected: { open: false } },
  { name: 'open at its widest past it', pointerWidth: 900, expected: { open: true, width: 400 } },
]

/** A stored width and the width that the side list takes from it. */
export const clampCases = [
  { name: 'a width between the limits', width: 260, expected: 260 },
  { name: 'a width under the narrowest', width: 50, expected: 200 },
  { name: 'a width over the widest', width: 1000, expected: 400 },
]
