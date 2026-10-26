import { describe, expect, it } from 'vitest'

import { activeFilterCount, filterQuery, filterValuesOf } from '../filter.utils'
import { testFields } from './filter.reducer.data'
import { addressValuesCases, countCases, filterQueryCases } from './filter.utils.data'

describe('activeFilterCount', () => {
  it.each(countCases)('counts $name', ({ values, count }) => {
    expect(activeFilterCount(values)).toBe(count)
  })
})

describe('filterValuesOf', () => {
  it.each(addressValuesCases)('reads $name', ({ query, values }) => {
    expect(filterValuesOf(new URLSearchParams(query), testFields)).toEqual(values)
  })
})

describe('filterQuery', () => {
  it.each(filterQueryCases)('$name', ({ query, values, expected }) => {
    expect(filterQuery(new URLSearchParams(query), testFields, values)).toBe(expected)
  })
})
