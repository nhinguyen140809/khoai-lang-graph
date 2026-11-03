import { describe, expect, it } from 'vitest'

import { validateUsageQuery } from '../usage.validators'
import { acceptedCases, refusedCases } from './usage.validators.data'

describe('validateUsageQuery', () => {
  it.each(acceptedCases)('reads $name', ({ query, month, grouping }) => {
    expect(validateUsageQuery(new URLSearchParams(query))).toEqual({ month, grouping })
  })

  it.each(refusedCases)('refuses $name', ({ query, problem }) => {
    expect(validateUsageQuery(new URLSearchParams(query))).toEqual({ problem })
  })
})
