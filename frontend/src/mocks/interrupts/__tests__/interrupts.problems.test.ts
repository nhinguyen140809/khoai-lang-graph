import { describe, expect, it } from 'vitest'

import { HttpStatus } from '@/shared/api/http'

import { runNotWaitingForAnswer } from '../interrupts.problems'

describe('runNotWaitingForAnswer', () => {
  it('answers 409 invalid_state', async () => {
    const answer = runNotWaitingForAnswer()

    expect(answer.status).toBe(HttpStatus.Conflict)
    expect(await answer.json()).toMatchObject({ code: 'invalid_state' })
  })
})
