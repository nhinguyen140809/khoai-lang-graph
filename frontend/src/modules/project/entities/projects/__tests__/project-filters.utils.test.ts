import { describe, expect, it } from 'vitest'

import { isFiltered, projectFiltersOf } from '../project-filters.utils'
import { isFilteredCases, projectFiltersCases } from './project-filters.utils.data'

describe('projectFiltersOf', () => {
  it.each(projectFiltersCases)('reads $name', ({ values, filters }) => {
    expect(projectFiltersOf(values)).toEqual(filters)
  })
})

describe('isFiltered', () => {
  it.each(isFilteredCases)('is $filtered for $name', ({ filters, filtered }) => {
    expect(isFiltered(filters)).toBe(filtered)
  })
})
