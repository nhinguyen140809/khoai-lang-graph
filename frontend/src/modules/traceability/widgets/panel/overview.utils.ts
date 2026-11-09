import type { Route } from 'next'

import { type Coverage, isActGap } from '@/modules/trace/entities'

import { overviewRootId, type OverviewRow } from './overview.types'
import { tracePanelMessages } from './trace-panel.constants'

/** What the rows of the overview read: the coverage, the count of the open issues, and their pages. */
interface OverviewRowsInput {
  coverage: Coverage
  /** The count of the open issues, or null while their read has not answered. */
  issuesCount: number | null
  /** The page of the gap of each key. */
  gapOf: (key: string) => Route
  /** The page of the open issues. */
  issues: Route
}

/**
 * The rows of the overview, by id: one per gap of the coverage, then the open issues. A gap reads
 * its count in the tone of its level, act for the gaps that ask the user to act now and follow for
 * the others, neutral at zero; the open issues read as follow, and their count stays out until
 * their read answers.
 */
export function overviewRows({
  coverage,
  issuesCount,
  gapOf,
  issues,
}: OverviewRowsInput): Record<string, OverviewRow> {
  const rows: Record<string, OverviewRow> = {}
  const children: string[] = []

  const add = (row: OverviewRow) => {
    rows[row.id] = row
    children.push(row.id)
  }

  for (const { key, title, description, items } of coverage.gaps) {
    add({
      id: `gap:${key}`,
      name: title,
      href: gapOf(key),
      count: items.length,
      tone: items.length === 0 ? 'neutral' : isActGap(key) ? 'warning' : 'primary',
      description,
      children: [],
    })
  }

  add({
    id: 'open-issues',
    name: tracePanelMessages.openIssues,
    href: issues,
    count: issuesCount,
    tone: issuesCount === 0 ? 'neutral' : 'primary',
    description: null,
    children: [],
  })

  rows[overviewRootId] = {
    id: overviewRootId,
    name: '',
    href: null,
    count: null,
    tone: 'neutral',
    description: null,
    children,
  }
  return rows
}
