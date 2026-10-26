import { describe, expect, it } from 'vitest'

import {
  choice,
  choiceProblem,
  isGivenWrong,
  jsonBoolean,
  jsonBooleanProblem,
  jsonObject,
  jsonObjectProblem,
  optionalText,
  optionalTextProblem,
  positiveInteger,
  positiveIntegerProblem,
  requiredText,
  requiredTextProblem,
} from '../field-values.utils'
import {
  choiceCases,
  isGivenWrongCases,
  jsonBooleanCases,
  jsonObjectCases,
  optionalTextCases,
  positiveIntegerCases,
  requiredTextCases,
  statuses,
} from './field-values.utils.data'

describe('optionalText', () => {
  it.each(optionalTextCases)('reads $name', ({ value, expected }) => {
    expect(optionalText(value)).toBe(expected)
  })
})

describe('optionalTextProblem', () => {
  it('names the field and says to enter text, or nothing', () => {
    expect(optionalTextProblem('summary')).toEqual({
      field: 'summary',
      message: 'Enter text, or nothing.',
    })
  })
})

describe('positiveInteger', () => {
  it.each(positiveIntegerCases)('reads $name', ({ value, expected }) => {
    expect(positiveInteger(value)).toBe(expected)
  })
})

describe('positiveIntegerProblem', () => {
  it('names the field and says to enter a number from 1', () => {
    expect(positiveIntegerProblem('position')).toEqual({
      field: 'position',
      message: 'Enter a number from 1.',
    })
  })
})

describe('requiredText', () => {
  it.each(requiredTextCases)('reads $name', ({ value, expected }) => {
    expect(requiredText(value)).toBe(expected)
  })
})

describe('choice', () => {
  it.each(choiceCases)('reads $name', ({ value, expected }) => {
    expect(choice(statuses, value)).toBe(expected)
  })
})

describe('jsonObject', () => {
  it.each(jsonObjectCases)('reads $name', ({ value, expected }) => {
    expect(jsonObject(value)).toEqual(expected)
  })
})

describe('jsonBoolean', () => {
  it.each(jsonBooleanCases)('reads $name', ({ value, expected }) => {
    expect(jsonBoolean(value)).toBe(expected)
  })
})

describe('the problems of the fields', () => {
  it.each([
    { problem: requiredTextProblem('name'), message: 'Enter a value.' },
    { problem: choiceProblem('status'), message: 'Choose one of the values.' },
    { problem: jsonObjectProblem('content'), message: 'Send an object.' },
    { problem: jsonBooleanProblem('pinned'), message: 'Send true or false.' },
  ])('says "$message"', ({ problem, message }) => {
    expect(problem.message).toBe(message)
  })

  it('names the field', () => {
    expect(choiceProblem('status').field).toBe('status')
  })
})

describe('isGivenWrong', () => {
  it.each(isGivenWrongCases)('says $name', ({ value, expected }) => {
    expect(isGivenWrong(value, requiredText)).toBe(expected)
  })
})
