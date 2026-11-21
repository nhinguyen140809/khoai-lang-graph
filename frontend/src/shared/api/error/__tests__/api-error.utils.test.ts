import { describe, expect, it } from 'vitest'

import {
  ApiError,
  errorMessageOf,
  fieldProblemsOf,
  isNotFoundError,
  isUnauthorizedError,
  isVersionConflict,
  toApiError,
} from '../api-error.utils'
import {
  errorMessageCases,
  fieldProblemsCases,
  messages,
  notFoundCases,
  toApiErrorCases,
  unauthorizedCases,
  versionConflictCases,
} from './api-error.utils.data'

describe('toApiError', () => {
  it.each(toApiErrorCases)('reads $name', ({ status, body, message, error }) => {
    const read = toApiError(status, body, message)

    expect(read).toBeInstanceOf(ApiError)
    expect(read).toMatchObject(error)
  })
})

describe('errorMessageOf', () => {
  it.each(errorMessageCases)('gives $name', ({ error, message }) => {
    expect(errorMessageOf(error, messages)).toBe(message)
  })
})

describe('errorMessageOf without messages', () => {
  it('gives the message of the error, whatever its code and status', () => {
    expect(errorMessageOf(errorMessageCases[0]?.error ?? new Error('x'))).toBe('x')
    expect(errorMessageOf(new Error('Network down'))).toBe('Network down')
  })
})

describe('fieldProblemsOf', () => {
  it.each(fieldProblemsCases)('gives $name', ({ error, problems }) => {
    expect(fieldProblemsOf(error)).toBe(problems)
  })
})

describe('isNotFoundError', () => {
  it.each(notFoundCases)('is $notFound for $name', ({ error, notFound }) => {
    expect(isNotFoundError(error)).toBe(notFound)
  })
})

describe('isVersionConflict', () => {
  it.each(versionConflictCases)('is $isConflict for $name', ({ error, isConflict }) => {
    expect(isVersionConflict(error)).toBe(isConflict)
  })
})

describe('isUnauthorizedError', () => {
  it.each(unauthorizedCases)('is $isUnauthorized for $name', ({ error, isUnauthorized }) => {
    expect(isUnauthorizedError(error)).toBe(isUnauthorized)
  })
})
