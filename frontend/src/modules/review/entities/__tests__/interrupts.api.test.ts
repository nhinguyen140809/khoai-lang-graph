import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { itSendsRequests } from '@/test/suites'

import { findPendingInterrupt, listRunInterrupts, resumeRun } from '../interrupts.api'
import { sentRequestCases } from './interrupts.api.data'

describe('listRunInterrupts', () => {
  it('reads the interrupts of run 3 in the order of its checkpoints, with their statuses', async () => {
    const { items } = await listRunInterrupts(runIds.mentorMain3, null, 100)

    expect(items.map(({ node, status }) => ({ node, status }))).toEqual([
      { node: 'checkpoint_personas', status: 'resolved' },
      { node: 'checkpoint_analysis', status: 'pending' },
    ])
  })

  it('throws for a run that does not exist', async () => {
    await expect(listRunInterrupts('missing', null, 100)).rejects.toThrow('HTTP 404')
  })

  itSendsRequests(sentRequestCases)
})

describe('findPendingInterrupt', () => {
  it('reads the review that run 3 waits for', async () => {
    await expect(findPendingInterrupt(runIds.mentorMain3)).resolves.toMatchObject({
      node: 'checkpoint_analysis',
      status: 'pending',
    })
  })

  it('reads null for a run that waits for nothing', async () => {
    await expect(findPendingInterrupt(runIds.mentorMain1)).resolves.toBeNull()
  })
})

describe('resumeRun', () => {
  it('answers the review, and the run goes on', async () => {
    const pending = assertPresent(
      await findPendingInterrupt(runIds.mentorMain3),
      'Run 3 waits for a review.',
    )

    const run = await resumeRun(
      runIds.mentorMain3,
      {
        interrupt_id: pending.id,
        option: 'accept',
        feedback: null,
        answers: {},
        modified_items: [],
      },
      'answer-key',
    )

    expect(run).toMatchObject({ status: 'running', current_stage: 'specification' })
  })
})
