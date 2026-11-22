import type { ReactNode } from 'react'

/**
 * The sides of the bar of the desk, which hold the items registered with `useDeskBarItem`.
 * @view user
 */
export const DeskBarSide = {
  /** What the page is about, such as the name of the open project and its menu. */
  Left: 'left',
  /** What the page offers to do, such as its buttons. */
  Right: 'right',
} as const

export type DeskBarSide = (typeof DeskBarSide)[keyof typeof DeskBarSide]

/** An item of the bar of the desk, registered with `useDeskBarItem` or placed with `DeskBarItem`. */
export interface DeskBarItem {
  side: DeskBarSide
  /**
   * Where the item sits on its side: the items go from the lowest order to the highest, left to
   * right, and two items of the same order keep the order in which they came. 0 by default.
   */
  order?: number | undefined
  /** What the item shows; it renders in the bar, inside the providers of the app. */
  content: ReactNode
}
