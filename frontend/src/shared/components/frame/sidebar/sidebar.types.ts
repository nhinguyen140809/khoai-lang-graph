/** The widths of the side list while the user resizes it by dragging its edge, in pixels. */
export interface SidebarWidths {
  /** The width before the user resizes it. */
  initial: number
  /** The narrowest the side list gets while it stays open. */
  min: number
  /** The widest the side list gets. */
  max: number
  /**
   * Dragged with the pointer nearer than this to its left side, the side list folds to its rail;
   * dragged from the rail past it, the side list opens again.
   */
  foldBelow: number
}

/** The side list while its edge is dragged: open at a width, or folded to its rail. */
export type SidebarSize = { open: true; width: number } | { open: false }

/** How the side list shows: open, with its names, or folded to its rail of icons. */
export type SidebarLayout = 'expanded' | 'rail'
