import type { View } from '@/shared/lib/view'

import type { Sketch } from './LayoutSketches'

/** How the pictures of a layout sit in its card: one picture, or several in a pile that turns. */
export type FigureArrangement = 'single' | 'stack'

export interface LayoutOption {
  view: View
  title: string
  description: string
  arrangement: FigureArrangement
  /** The pictures of the layout, each with its name; one for a layout of one screen. */
  figures: readonly { label: string; sketch: Sketch }[]
}
