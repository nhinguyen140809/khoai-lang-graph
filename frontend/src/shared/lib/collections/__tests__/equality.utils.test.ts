import { describe, expect, it } from 'vitest'

import { isSameValue } from '../equality.utils'
import { sameValueCases } from './equality.utils.data'

describe('isSameValue', () => {
  it.each(sameValueCases)('returns $expected for $name', ({ a, b, expected }) => {
    expect(isSameValue(a, b)).toBe(expected)
  })
})
