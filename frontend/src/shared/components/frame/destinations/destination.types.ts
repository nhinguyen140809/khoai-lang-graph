import type { Route } from 'next'
import type { ReactNode } from 'react'

interface DestinationBase {
  /** Unique on the activity bar; the frame stores the id of the side panel the user chose. */
  id: string
  label: string
  /** An icon element, such as `<SearchIcon />`; the frame sets its size. */
  icon: ReactNode
  /** Items at the bottom sit above the account menu, like settings. */
  placement?: 'top' | 'bottom'
}

/** A feature on the activity bar, with the side panel it shows. */
export interface FeatureDestination extends DestinationBase {
  /** The start page of the feature. The pages at this address and under it belong to it. */
  href: Route
  /** Other addresses whose pages, and the pages under them, belong to the feature. */
  paths?: readonly string[]
  /** Navigation inside the feature, usually a SidePanel. */
  panel: ReactNode
  /** Shown on the icon and read after its name, such as the count of reviews waiting. */
  badge?: ReactNode
}

/** A feature planned for later: shown disabled, with the reason. */
export interface PlannedDestination extends DestinationBase {
  note: string
}

export type Destination = FeatureDestination | PlannedDestination

/**
 * The icons of editor tabs, by the name that a page gives its tab, such as `artifacts.item`. A
 * feature starts the names of its icons with its own name, so that two features never share one.
 */
export type TabIcons = Readonly<Record<string, ReactNode>>

/**
 * An item at the bottom of the activity bar, below the features, registered with
 * `useActivityBarItem`, such as the account menu.
 */
export interface ActivityBarItem {
  /**
   * Where the item sits among the others: from the lowest order to the highest, top to bottom, and
   * two items of the same order keep the order in which they came. 0 by default.
   */
  order?: number
  /** What the item shows; it renders in the activity bar, inside the providers of the app. */
  content: ReactNode
}
