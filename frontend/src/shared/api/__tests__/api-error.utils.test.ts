import { describe, expect, it } from 'vitest'

import { ApiError, errorMessageOf, isNotFoundError, toApiError } from '../api-error.utils'
import { errorMessageCases, messages, notFoundCases, toApiErrorCases } from './api-error.utils.data'

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

describe('isNotFoundError', () => {
  it.each(notFoundCases)('is $notFound for $name', ({ error, notFound }) => {
    expect(isNotFoundError(error)).toBe(notFound)
  })
})
