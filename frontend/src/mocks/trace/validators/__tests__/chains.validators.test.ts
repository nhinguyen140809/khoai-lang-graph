import { describe, expect, it } from 'vitest'

import { validateTraceQuery } from '../chains.validators'
import { refusedTraceQueryCases, traceQueryCases } from './chains.validators.data'

describe('validateTraceQuery', () => {
  it.each(traceQueryCases)('reads $name', ({ query, defaultDepth, expected }) => {
    expect(validateTraceQuery(new URLSearchParams(query), defaultDepth)).toEqual(expected)
  })

  it.each(refusedTraceQueryCases)('refuses $name', ({ query, fields }) => {
    const read = validateTraceQuery(new URLSearchParams(query), 5)

    expect('problems' in read && read.problems.map(({ field }) => field)).toEqual(fields)
  })
})
