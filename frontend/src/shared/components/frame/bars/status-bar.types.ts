import type { ReactNode } from 'react'

/** The sides of the status bar, which hold the items registered with `useStatusBarItem`. */
export const StatusBarSide = {
  /** What the screen reports about its work, such as the run of the project. */
  Left: 'left',
  /** What the page on screen reports, before the notifications at the end of the bar. */
  Right: 'right',
} as const

export type StatusBarSide = (typeof StatusBarSide)[keyof typeof StatusBarSide]

/** An item of the status bar, registered with `useStatusBarItem`. */
export interface StatusBarItem {
  side: StatusBarSide
  /**
   * Where the item sits on its side: the items go from the lowest order to the highest, left to
   * right, and two items of the same order keep the order in which they came. 0 by default.
   */
  order?: number
  /** What the item shows; it renders in the status bar, inside the providers of the app. */
  content: ReactNode
}
