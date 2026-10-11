import { describe, expect, it } from 'vitest'

import { groupSteps } from '../step-groups.utils'
import type { WorkflowStep } from '../workflow.types'

function step(sequence: number, subject: string | null, stage = 'interviewing', key?: string) {
  return {
    id: `s${String(sequence)}`,
    run_id: 'r1',
    sequence,
    node: 'interviewer',
    agent_role: null,
    stage,
    status: 'succeeded',
    iteration: 0,
    subject_item_id: subject,
    model_id: null,
    llm_calls: 0,
    usage: { input_tokens: 0, output_tokens: 0, cost_usd: 0, duration_ms: 0 },
    produced:
      key === undefined
        ? []
        : [{ item_id: `i${String(sequence)}`, kind: 'interview', key, version: 1 }],
    error: null,
    started_at: '2026-10-01T00:00:00Z',
    finished_at: null,
  } satisfies WorkflowStep
}

describe('groupSteps', () => {
  it('joins consecutive steps on one subject and stage, named by the key of what they made', () => {
    const entries = groupSteps([
      step(1, 'p1', 'interviewing', 'INT-001#1'),
      step(2, 'p1'),
      step(3, 'p1'),
    ])

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ type: 'group', key: 'INT-001' })
    expect(entries[0]?.type === 'group' && entries[0].steps).toHaveLength(3)
  })

  it('does not join steps of other subjects, of other stages, or without a subject', () => {
    const entries = groupSteps([
      step(1, 'p1'),
      step(2, 'p2'),
      step(3, 'p2', 'analysis'),
      step(4, null),
      step(5, null),
    ])

    expect(entries.map(({ type }) => type)).toEqual(['step', 'step', 'step', 'step', 'step'])
  })

  it('orders the steps by sequence', () => {
    const entries = groupSteps([step(3, null), step(1, null), step(2, null)])

    expect(entries.map((entry) => (entry.type === 'step' ? entry.step.sequence : 0))).toEqual([
      1, 2, 3,
    ])
  })
})
