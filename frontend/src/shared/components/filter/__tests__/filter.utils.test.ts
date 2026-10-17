import { describe, expect, it } from 'vitest'

import { activeFilterCount, filterSearch, filterValuesOf } from '../filter.utils'
import { testFields } from './filter.reducer.data'
import { addressSearchCases, addressValuesCases, countCases } from './filter.utils.data'

describe('activeFilterCount', () => {
  it.each(countCases)('counts $name', ({ values, count }) => {
    expect(activeFilterCount(values)).toBe(count)
  })
})

describe('filterValuesOf', () => {
  it.each(addressValuesCases)('reads $name', ({ search, values }) => {
    expect(filterValuesOf(new URLSearchParams(search), testFields)).toEqual(values)
  })
})

describe('filterSearch', () => {
  it.each(addressSearchCases)('$name', ({ search, values, query }) => {
    expect(filterSearch(new URLSearchParams(search), testFields, values)).toBe(query)
  })
})
