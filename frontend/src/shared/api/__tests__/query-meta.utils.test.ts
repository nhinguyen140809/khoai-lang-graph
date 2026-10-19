import { describe, expect, it } from 'vitest'

import { costQueryMeta, holdsCost } from '../query-meta.utils'
import { holdsCostCases } from './query-meta.utils.data'

describe('holdsCost', () => {
  it.each(holdsCostCases)('tells $name: $holds', ({ meta, holds }) => {
    expect(holdsCost({ meta })).toBe(holds)
  })

  it('marks the meta of a cost', () => {
    expect(holdsCost({ meta: costQueryMeta })).toBe(true)
  })
})
