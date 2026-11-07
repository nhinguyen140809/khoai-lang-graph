import { describe, expect, it } from 'vitest'

import { interruptsOfRun } from '@/mocks/interrupts/interrupts.lookup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds, userId } from '@/mocks/shared/db'
import type { Run } from '@/modules/run/entities'

import { decisionOption } from '../interrupts.utils'

// Run 1 of the mentor thread, which went through the whole workflow.
const mentorRun1: Run = buildRun({
  id: runIds.mentorMain1,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 1,
  status: 'succeeded',
  current_stage: 'done',
})

describe('decisionOption', () => {
  it('gives the option that answered a resolved review, and its decision', () => {
    const [personas] = interruptsOfRun(mentorRun1)
    const decision = personas?.decision

    expect(decision).toMatchObject({ option: 'approve', decided_by: userId })
    expect(decisionOption(personas ?? { options: [], decision: null })?.label).toBe(
      'Approve the interviewees',
    )
  })

  it('gives null while a review waits, and for one taken with the defaults of its checkpoint', () => {
    const failedRun = buildRun({
      id: runIds.mentorMain2,
      thread_id: threadIds.mentorMain,
      project_id: projectIds.mentor,
      number: 2,
      status: 'failed',
      current_stage: 'specification',
    })
    const [personasOfFailed] = interruptsOfRun(failedRun)

    expect(personasOfFailed?.decision?.decided_by).toBeNull()
    expect(personasOfFailed?.decision?.option).toBe('approve')
  })

  it('gives null for a pending interrupt without a decision', () => {
    expect(decisionOption({ options: [], decision: null })).toBeNull()
  })
})
