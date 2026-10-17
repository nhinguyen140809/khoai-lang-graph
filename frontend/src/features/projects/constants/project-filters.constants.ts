import { runStatusesByAttention } from '@/shared/domain/run-status'

import type { ProjectRunFilter } from '../projects.types'

// The filters of the project list: their keys, their values and their words.

/**
 * The filters of the project list, by their key in the values of the filters, which also names
 * their parameter in the address of the page: `?run-status=failed&last-activity=7`.
 */
export const projectFilterKeys = {
  runStatus: 'run-status',
  lastActivity: 'last-activity',
} as const

/** The values of the status filter, from the status that needs the user most, then no run yet. */
export const projectRunFilters = [
  ...runStatusesByAttention,
  'none',
] as const satisfies readonly ProjectRunFilter[]

/** The periods of the last activity filter, each a number of days before now. */
export const lastActivityPeriods = [
  { days: 1, label: 'In the last day' },
  { days: 2, label: 'In the last 2 days' },
  { days: 7, label: 'In the last 7 days' },
  { days: 30, label: 'In the last 30 days' },
] as const

export const projectFilterMessages = {
  runStatus: 'Status',
  lastActivity: 'Last activity',
  /** No project of the list matches the filters applied. */
  noMatch: 'No projects match the filters',
  noMatchHint: 'Choose other filters, or clear them to see every project.',
}
