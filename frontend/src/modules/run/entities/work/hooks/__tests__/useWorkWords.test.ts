import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { assertPresent } from '@/shared/lib/guards'

import type { RunStep } from '../../../steps/run-steps.types'
import { workEntries } from '../../work-entries.utils'
import { useWorkWords } from '../useWorkWords'

function wordsOf(
  steps: (Partial<RunStep> & Pick<RunStep, 'sequence'>)[],
  run: { error: { code: string; message: string; stage: string } | null } | null,
) {
  const entry = assertPresent(
    workEntries(
      steps.map((fields) => buildStep(fields)),
      null,
    )[0],
    'the line of work',
  )
  const { result } = renderHook(() => useWorkWords(entry, run))
  return result.current
}

describe('useWorkWords', () => {
  it('reads the words of a line that is done, with nothing for its status', () => {
    const words = wordsOf(
      [
        {
          sequence: 1,
          agent_role: 'analyst',
          stage: 'analysis',
          iteration: 1,
          started_at: '2026-10-06T08:30:00Z',
          finished_at: '2026-10-06T08:32:00Z',
          produced: [{ item_id: 'i1', kind: 'analyzed_requirement', key: 'AR-001', version: 1 }],
        },
      ],
      null,
    )

    expect(words).toMatchObject({
      status: null,
      round: 'Round 2',
      took: 'Took 2 minutes',
      writes: '1 written',
      failure: null,
    })
  })

  it('says why a failed line stopped', () => {
    const words = wordsOf(
      [{ sequence: 1, agent_role: 'analyst', stage: 'analysis', status: 'failed' }],
      {
        error: {
          code: 'cost_limit_exceeded',
          message: 'The next model call would exceed the cost limit of the run.',
          stage: 'analysis',
        },
      },
    )

    expect(words.status).toBe('Failed')
    expect(words.failure).toBe('The work reached its budget.')
  })

  it('keeps the message of the error of the run when it knows no code', () => {
    const words = wordsOf(
      [{ sequence: 1, agent_role: 'analyst', stage: 'analysis', status: 'failed' }],
      { error: null },
    )

    expect(words.failure).toBe('The work stopped because of an error.')
  })
})
