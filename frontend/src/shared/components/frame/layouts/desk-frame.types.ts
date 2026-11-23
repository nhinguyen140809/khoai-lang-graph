import type { Route } from 'next'
import type { ReactNode } from 'react'

/**
 * What the app gives the desk, whichever arrangement draws it. A part that the arrangement does not
 * draw is never mounted, so it costs nothing there.
 */
export interface DeskFrameProps {
  /** The address of the home page, which the name of the app leads to. */
  homeHref: Route
  /**
   * The side list under its first row, top to bottom: what starts new work, the sections, the
   * account. Drawn by the arrangement that has a side list; it fills the `Sidebar`, so it is built
   * from the parts of `@/shared/components/ui/sidebar`.
   */
  sidebar: ReactNode
  /** The menu of the account, for the arrangement that keeps it in the bar at the top. */
  accountMenu: ReactNode
  /** Components that render nothing in place: dialogs mounted once. */
  contributions?: ReactNode
  /** The page on show. */
  children: ReactNode
}
