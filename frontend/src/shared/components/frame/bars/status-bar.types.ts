import type { ReactNode } from 'react'

import type { StatusBarSide } from './status-bar.constants'

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
