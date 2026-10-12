import type { Route } from 'next'
import type { ReactNode } from 'react'

interface ActivityBase {
  /** Unique on the activity bar; the frame stores the id of the side panel the user chose. */
  id: string
  label: string
  /** An icon element, such as `<SearchIcon />`; the frame sets its size. */
  icon: ReactNode
  /** Items at the bottom sit above the account menu, like settings. */
  placement?: 'top' | 'bottom'
}

/** A feature on the activity bar, with the side panel it shows. */
export interface FeatureActivity extends ActivityBase {
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
export interface PlannedActivity extends ActivityBase {
  note: string
}

export type Activity = FeatureActivity | PlannedActivity

/** The icons of editor tabs, by the name that a page gives its tab, such as `item`. */
export type TabIcons = Readonly<Record<string, ReactNode>>
