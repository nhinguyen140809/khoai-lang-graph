import { describe, expect, it } from 'vitest'

import { errorResponse } from '../error-response.utils'
import { sharedProblemCases } from './error-response.utils.data'

describe('problem', () => {
  it('answers in the Problem Details format', async () => {
    const answer = errorResponse(409, 'invalid_state', 'Invalid state', 'The run has ended.', [
      { field: 'status', message: 'Ended.' },
    ])

    expect(answer.status).toBe(409)
    expect(answer.headers.get('Content-Type')).toBe('application/problem+json')
    expect(await answer.json()).toEqual({
      type: 'about:blank',
      title: 'Invalid state',
      status: 409,
      code: 'invalid_state',
      detail: 'The run has ended.',
      errors: [{ field: 'status', message: 'Ended.' }],
    })
  })

  it('has no detail and no field problem by default', async () => {
    expect(await errorResponse(500, 'internal_error', 'Internal error').json()).toMatchObject({
      detail: null,
      errors: [],
    })
  })
})

describe('the problems the handlers share', () => {
  it.each(sharedProblemCases)('$name answers $status', async ({ answer, status, fields }) => {
    const response = answer()

    expect(response.status).toBe(status)
    expect(await response.json()).toMatchObject({ status, ...fields })
  })
})
