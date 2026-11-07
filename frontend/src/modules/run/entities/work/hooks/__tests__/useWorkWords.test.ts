import { renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { buildStep } from '@/mocks/runs/fixtures/runs.fixtures'
import { assertPresent } from '@/shared/lib/guards'
import { ViewProvider } from '@/shared/lib/view'

import type { RunStep } from '../../../steps/run-steps.types'
import { workEntries } from '../../work-entries.utils'
import { useWorkWords } from '../useWorkWords'

function wordsOf(
  steps: (Partial<RunStep> & Pick<RunStep, 'sequence'>)[],
  run: { error: { code: string; message: string; stage: string } | null } | null,
  view: 'user' | 'developer' = 'user',
) {
  const entry = assertPresent(
    workEntries(
      steps.map((fields) => buildStep(fields)),
      null,
    )[0],
    'the line of work',
  )
  const { result } = renderHook(() => useWorkWords(entry, run), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(ViewProvider, { value: view, children }),
  })
  return result.current
}

describe('useWorkWords', () => {
  it('reads the words of the user view, with nothing for the status of a line that is done', () => {
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
      details: [],
      failure: null,
    })
  })

  it('reads the words of the developer view', () => {
    const words = wordsOf(
      [
        {
          sequence: 1,
          agent_role: 'analyst',
          stage: 'analysis',
          model_id: 'anthropic:claude-sonnet-5',
          started_at: '2026-10-06T08:30:00Z',
          finished_at: '2026-10-06T08:32:05Z',
          produced: [
            { item_id: 'i1', kind: 'analyzed_requirement', key: 'AR-001', version: 1 },
            { item_id: 'i2', kind: 'persona', key: 'PER-001', version: 2 },
          ],
        },
      ],
      null,
      'developer',
    )

    expect(words).toMatchObject({
      round: null,
      took: '2 min 5 s',
      writes: '+1 ~1',
      details: ['1 step', 'anthropic:claude-sonnet-5', '$0.00'],
    })
  })

  it('says why a failed line stopped, in the words of the user view', () => {
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
