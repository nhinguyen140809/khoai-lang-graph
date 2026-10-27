import { describe, expect, it } from 'vitest'

import { clamp, decimalsOf } from '../number.utils'
import { clampCases, decimalsCases } from './number.utils.data'

describe('clamp', () => {
  it.each(clampCases)('holds $name', ({ value, limits, expected }) => {
    expect(clamp(value, limits)).toBe(expected)
  })

  it('takes no limit at all', () => {
    expect(clamp(7)).toBe(7)
  })
})

describe('decimalsOf', () => {
  it.each(decimalsCases)('counts $name', ({ value, expected }) => {
    expect(decimalsOf(value)).toBe(expected)
  })
})
