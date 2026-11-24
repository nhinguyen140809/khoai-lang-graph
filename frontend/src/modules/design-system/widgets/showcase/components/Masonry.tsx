import type { ReactNode } from 'react'

/**
 * The cards of a tab in a grid: one column on a narrow window, two on a medium one and twelve on a
 * wide one, where a card takes the columns of its width and sits in the first hole that fits it,
 * so that the cards cover the tab with no gaps. The rows are thin: each card
 * takes as many as its height needs.
 */
export function Masonry({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-flow-dense card-grid grid-cols-1 gap-x-4 md:grid-cols-2 xl:grid-cols-12">
      {children}
    </div>
  )
}
