import { describe, expect, it } from 'vitest'

import { HttpHeader, HttpStatus, MediaType } from '@/shared/api/http'

import { errorResponse } from '../error-response.utils'
import { errorResponseCases } from './error-response.utils.data'

describe('errorResponse', () => {
  it('answers in the Problem Details format', async () => {
    const answer = errorResponse(
      HttpStatus.Conflict,
      'invalid_state',
      'Invalid state',
      'The run has ended.',
      [{ field: 'status', message: 'Ended.' }],
    )

    expect(answer.status).toBe(HttpStatus.Conflict)
    expect(answer.headers.get(HttpHeader.ContentType)).toBe(MediaType.ProblemJson)
    expect(await answer.json()).toEqual({
      type: 'about:blank',
      title: 'Invalid state',
      status: HttpStatus.Conflict,
      code: 'invalid_state',
      detail: 'The run has ended.',
      errors: [{ field: 'status', message: 'Ended.' }],
    })
  })

  it('has no detail and no field problem by default', async () => {
    expect(
      await errorResponse(
        HttpStatus.InternalServerError,
        'internal_error',
        'Internal error',
      ).json(),
    ).toMatchObject({
      detail: null,
      errors: [],
    })
  })
})

describe('the problems the handlers share', () => {
  it.each(errorResponseCases)('$name answers $status', async ({ answer, status, fields }) => {
    const response = answer()

    expect(response.status).toBe(status)
    expect(await response.json()).toMatchObject({ status, ...fields })
  })
})
