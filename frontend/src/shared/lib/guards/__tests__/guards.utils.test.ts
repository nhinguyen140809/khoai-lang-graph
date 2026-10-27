import { describe, expect, it } from 'vitest'

import { isOneOf, isRecord, isString } from '../guards.utils'
import { isStringCases, oneOfCases, recordCases } from './guards.utils.data'

describe('isRecord', () => {
  it.each(recordCases)('returns $expected for $name', ({ value, expected }) => {
    expect(isRecord(value)).toBe(expected)
  })
})

describe('isOneOf', () => {
  it.each(oneOfCases)('returns $expected for $name', ({ values, value, expected }) => {
    expect(isOneOf(values, value)).toBe(expected)
  })
})

describe('isString', () => {
  it.each(isStringCases)('returns $expected for $name', ({ value, expected }) => {
    expect(isString(value)).toBe(expected)
  })
})
