import type { Route } from 'next'

/** One row of the overview of the panel: a gap of the coverage, or the open issues. */
export interface OverviewRow {
  id: string
  /** The title of the row. */
  name: string
  /** The page the row opens in the preview tab; null for the root, which no row draws. */
  href: Route | null
  /** The count of the row in its badge, or null while it is not known. */
  count: number | null
  /** The tone of the badge: the level of the gap, neutral at zero. */
  tone: 'warning' | 'primary' | 'neutral'
  /** One sentence about the row, for its tooltip; null when the row has none. */
  description: string | null
  children: string[]
}

/** The id of the root of the tree of the overview, which no row draws. */
export const overviewRootId = 'overview-root'
