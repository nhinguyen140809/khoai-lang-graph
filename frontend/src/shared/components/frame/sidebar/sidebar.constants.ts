import type { SidebarWidths } from './sidebar.types'

/** The words of the side list of the desk. */
export const sidebarMessages = {
  /** The button that folds the side list, or opens it over the page on a narrow screen. */
  hideSidebar: 'Hide the sidebar',
  showSidebar: 'Show the sidebar',
  /** The edge of the side list, which resizes it when dragged and folds or opens it when clicked. */
  resizeOpenSidebar: 'Drag to resize the sidebar, click to hide it',
  resizeFoldedSidebar: 'Drag or click to show the sidebar',
  /** The button that empties the search box. */
  clearSearch: 'Clear the search',
}

/**
 * The widths of the side list as the user drags its edge. It starts at the width of the sidebar of
 * the UI kit (16rem), and folds to its rail once dragged well past its narrowest width.
 */
export const sidebarWidths = {
  initial: 256,
  min: 224,
  max: 384,
  foldBelow: 144,
} satisfies SidebarWidths

/** In pixels, how far the pointer moves before a press on the edge counts as a drag, not a click. */
export const sidebarDragStart = 5
