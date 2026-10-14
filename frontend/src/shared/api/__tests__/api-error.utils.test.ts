import { describe, expect, it } from 'vitest'

import { ApiErrorCode, HttpStatus } from '../api-error.constants'
import { ApiError, errorMessageOf, toApiError } from '../api-error.utils'

describe('toApiError', () => {
  it('reads the code, the detail and the field problems of a Problem Details body', () => {
    const error = toApiError(
      422,
      {
        type: 'about:blank',
        title: 'Validation failed',
        status: 422,
        code: 'validation_failed',
        detail: 'The name is missing.',
        errors: [{ field: 'name', message: 'Enter a name.' }],
      },
      'Failed to create the project (HTTP 422)',
    )

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'validation_failed',
      message: 'Failed to create the project (HTTP 422): The name is missing.',
      fieldErrors: [{ field: 'name', message: 'Enter a name.' }],
    })
  })

  it.each([
    ['no body', null],
    ['a text body', 'Bad Gateway'],
    ['a body of another shape', { code: 42 }],
  ])('keeps the status and the plain message for %s', (_name, body) => {
    expect(toApiError(502, body, 'Failed to load (HTTP 502)')).toMatchObject({
      status: 502,
      code: null,
      message: 'Failed to load (HTTP 502)',
      fieldErrors: [],
    })
  })

  it.each([null, ''])('keeps the plain message when the detail is %j', (detail) => {
    expect(
      toApiError(404, { code: 'not_found', detail }, 'Failed to load (HTTP 404)'),
    ).toMatchObject({ code: 'not_found', message: 'Failed to load (HTTP 404)' })
  })
})

describe('errorMessageOf', () => {
  const messages = {
    code: { [ApiErrorCode.RateLimited]: 'Wait a moment.' },
    status: {
      [HttpStatus.Unauthorized]: 'Wrong password.',
      [HttpStatus.TooManyRequests]: 'Slow down.',
    },
  }

  it('takes the words for the code first, then for the status', () => {
    expect(errorMessageOf(new ApiError('x', 429, 'rate_limited', []), messages)).toBe(
      'Wait a moment.',
    )
    expect(errorMessageOf(new ApiError('x', 401, 'unauthenticated', []), messages)).toBe(
      'Wrong password.',
    )
  })

  it('keeps the message of the error when no words are given for it', () => {
    expect(errorMessageOf(new ApiError('Failed (HTTP 500)', 500, null, []), messages)).toBe(
      'Failed (HTTP 500)',
    )
    expect(errorMessageOf(new Error('Network down'), messages)).toBe('Network down')
  })
})
