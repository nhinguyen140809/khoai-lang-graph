import { describe, expect, it } from 'vitest'

import { HttpStatus } from '@/shared/api/http'
import { assertPresent } from '@/shared/lib/guards'

import { findRun } from '../../runs/lookup/runs.lookup'
import { runIds } from '../../shared/db'
import { pendingInterruptOf } from '../interrupts.lookup'
import { refuseAnswerOfOtherInterrupt } from '../interrupts.problems'

describe('refuseAnswerOfOtherInterrupt', () => {
  it('refuses the answer when the run waits for nothing', () => {
    const run = assertPresent(findRun(runIds.mentorMain1), 'The mock data holds run 1.')

    expect(refuseAnswerOfOtherInterrupt(pendingInterruptOf(run), 'any')?.status).toBe(
      HttpStatus.Conflict,
    )
  })

  it('refuses the answer of another interrupt', () => {
    const run = assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')

    expect(refuseAnswerOfOtherInterrupt(pendingInterruptOf(run), 'another-interrupt')?.status).toBe(
      HttpStatus.Conflict,
    )
  })

  it('accepts the answer of the interrupt the run waits for', () => {
    const run = assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
    const pending = assertPresent(pendingInterruptOf(run), 'Run 3 waits for a review.')

    expect(refuseAnswerOfOtherInterrupt(pending, pending.id)).toBeNull()
  })
})
