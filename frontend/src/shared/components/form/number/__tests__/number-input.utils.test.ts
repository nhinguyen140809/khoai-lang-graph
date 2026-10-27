import { describe, expect, it } from 'vitest'

import {
  canStep,
  keyAction,
  numberFromText,
  numberToText,
  sanitizeNumberText,
  stepNumber,
  stepTimesOf,
} from '../number-input.utils'
import {
  canStepCases,
  fromTextCases,
  keyActionCases,
  sanitizeCases,
  stepCases,
  toTextCases,
} from './number-input.utils.data'

describe('stepNumber', () => {
  it.each(stepCases)('steps $name', ({ value, step, expected }) => {
    expect(stepNumber(value, step)).toBe(expected)
  })
})

describe('sanitizeNumberText', () => {
  it.each(sanitizeCases)('keeps $expected of $name', ({ text, options, expected }) => {
    expect(sanitizeNumberText(text, options)).toBe(expected)
  })
})

describe('numberFromText', () => {
  it.each(fromTextCases)('reads $name', ({ text, expected }) => {
    expect(numberFromText(text)).toBe(expected)
  })
})

describe('numberToText', () => {
  it.each(toTextCases)('writes $name', ({ value, expected }) => {
    expect(numberToText(value)).toBe(expected)
  })
})

describe('keyAction', () => {
  it.each(keyActionCases)('reads $name', ({ key, shift, expected }) => {
    expect(keyAction(key, shift)).toEqual(expected)
  })
})

describe('stepTimesOf', () => {
  it('is one step, and ten with Shift held', () => {
    expect(stepTimesOf(false)).toBe(1)
    expect(stepTimesOf(true)).toBe(10)
  })
})

describe('canStep', () => {
  it.each(canStepCases)('tells $name', ({ value, limits, direction, expected }) => {
    expect(canStep(value, direction, limits)).toBe(expected)
  })
})
