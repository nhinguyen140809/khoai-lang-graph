import { describe, expect, it } from 'vitest'

import { assertPresent, hasText, isBlank, isEmpty } from '../presence.utils'
import {
  blankCases,
  emptyCases,
  hasTextCases,
  missingCases,
  requiredCases,
} from './presence.utils.data'

describe('isBlank', () => {
  it.each(blankCases)('returns $expected for $name', ({ value, expected }) => {
    expect(isBlank(value)).toBe(expected)
  })
})

describe('isEmpty', () => {
  it.each(emptyCases)('returns $expected for $name', ({ value, expected }) => {
    expect(isEmpty(value)).toBe(expected)
  })
})

describe('hasText', () => {
  it.each(hasTextCases)('returns $expected for $name', ({ value, expected }) => {
    expect(hasText(value)).toBe(expected)
  })
})

describe('required', () => {
  it.each(requiredCases)('gives back $name', ({ value }) => {
    expect(assertPresent(value, 'Missing.')).toBe(value)
  })

  it.each(missingCases)('throws the message for $name', ({ value }) => {
    expect(() => assertPresent(value, 'The record is missing.')).toThrow('The record is missing.')
  })
})
