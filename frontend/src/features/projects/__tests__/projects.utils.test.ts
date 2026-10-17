import { describe, expect, it } from 'vitest'

import {
  isFiltered,
  noProjectFilters,
  projectFiltersOf,
  projectName,
  unfinishedRunCount,
} from '../projects.utils'
import {
  projectFiltersCases,
  projectNameCases,
  unfinishedRunCountCases,
} from './projects.utils.data'

describe('projectName', () => {
  it.each(projectNameCases)('shows $name', ({ project, shown }) => {
    expect(projectName(project)).toBe(shown)
  })
})

describe('unfinishedRunCount', () => {
  it.each(unfinishedRunCountCases)('counts $name', ({ counts, count }) => {
    expect(unfinishedRunCount({ unfinished_run_counts: counts })).toBe(count)
  })
})

describe('projectFiltersOf', () => {
  it.each(projectFiltersCases)('reads $name', ({ values, filters }) => {
    expect(projectFiltersOf(values)).toEqual(filters)
  })
})

describe('isFiltered', () => {
  it('tells the filters that narrow the list from those that do not', () => {
    expect(isFiltered(noProjectFilters)).toBe(false)
    expect(isFiltered({ runStatuses: [], activeWithinDays: 1 })).toBe(true)
    expect(isFiltered({ runStatuses: ['failed'], activeWithinDays: null })).toBe(true)
  })
})
