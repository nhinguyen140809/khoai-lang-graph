import { describe, expect, it } from 'vitest'

import {
  internalError,
  notFound,
  problem,
  unauthenticated,
  validationFailed,
} from '../problem.utils'

describe('problem', () => {
  it('answers in the Problem Details format', async () => {
    const answer = problem(409, 'invalid_state', 'Invalid state', 'The run has ended.', [
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
    expect(await problem(500, 'internal_error', 'Internal error').json()).toMatchObject({
      detail: null,
      errors: [],
    })
  })
})

describe('the problems the handlers share', () => {
  it.each([
    [notFound('The user'), 404, 'not_found', { detail: 'The user does not exist.' }],
    [unauthenticated('Sign in.'), 401, 'unauthenticated', { detail: 'Sign in.' }],
    [
      validationFailed([{ field: 'email', message: 'Enter a value.' }]),
      422,
      'validation_failed',
      { errors: [{ field: 'email', message: 'Enter a value.' }] },
    ],
    [internalError(), 500, 'internal_error', { detail: null }],
  ])('answers %#', async (answer, status, code, fields) => {
    expect(answer.status).toBe(status)
    expect(await answer.json()).toMatchObject({ status, code, ...fields })
  })
})
