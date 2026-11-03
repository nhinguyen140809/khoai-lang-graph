import { describe, expect, it } from 'vitest'

import { costQueryMeta } from '../query-meta.constants'
import { hasCost } from '../query-meta.utils'
import { hasCostCases } from './query-meta.utils.data'

describe('hasCost', () => {
  it.each(hasCostCases)('tells $name: $hasCost', ({ meta, hasCost: expected }) => {
    expect(hasCost({ meta })).toBe(expected)
  })

  it('marks the meta of a cost', () => {
    expect(hasCost({ meta: costQueryMeta })).toBe(true)
  })
})
