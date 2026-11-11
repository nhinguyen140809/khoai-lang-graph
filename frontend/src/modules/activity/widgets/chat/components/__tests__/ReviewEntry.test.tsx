import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { agentQuestionFixtures } from '@/mocks/interrupts/interrupts.fixtures'
import type { Interrupt } from '@/modules/review/entities'

import { ReviewEntry } from '../ReviewEntry'

const base: Interrupt = {
  id: 'i1',
  run_id: 'r1',
  step_id: 's1',
  node: 'ask_personas',
  purpose: 'ask',
  prompt: 'A few questions.',
  options: [],
  questions: agentQuestionFixtures,
  allow_edits: false,
  review_artifacts: [],
  status: 'resolved',
  created_at: '2026-10-06T08:30:00Z',
  resolved_at: '2026-10-06T08:31:00Z',
  decision: null,
}

describe('ReviewEntry', () => {
  it('lists what the user answered to the questions of an agent, not the stop of a run', () => {
    const [first] = agentQuestionFixtures
    if (first === undefined) throw new Error('The fixtures hold a question')
    const choice = first.choices[0]
    if (choice === undefined) throw new Error('The first question holds a choice')
    render(
      <ReviewEntry
        interrupt={{
          ...base,
          decision: {
            option: null,
            feedback: null,
            decided_by: 'u1',
            decided_at: base.resolved_at ?? '',
            answers: { [first.key]: { choice_keys: [choice.key], text: null, number: null } },
          },
        }}
      />,
    )

    expect(screen.getByText('Answered:')).toBeInTheDocument()
    expect(screen.getByText(first.prompt, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(choice.label)).toBeInTheDocument()
    expect(screen.queryByText(/Stopped with the run/)).not.toBeInTheDocument()
  })

  it('says that the defaults were taken when nobody answered', () => {
    render(
      <ReviewEntry
        interrupt={{
          ...base,
          decision: {
            option: null,
            feedback: null,
            decided_by: null,
            decided_at: base.resolved_at ?? '',
            answers: {},
          },
        }}
      />,
    )

    expect(screen.getByText('Answered with the default:')).toBeInTheDocument()
  })

  it('says that a cancelled ask stopped with the run', () => {
    render(<ReviewEntry interrupt={{ ...base, status: 'cancelled' }} />)

    expect(screen.getByText('Stopped with the run')).toBeInTheDocument()
  })

  it('words the option that answered a review', () => {
    render(
      <ReviewEntry
        interrupt={{
          ...base,
          purpose: 'review',
          options: [
            {
              key: 'approve',
              label: 'Approve',
              requires_feedback: false,
              approves: true,
              is_default: true,
            },
          ],
          decision: {
            option: 'approve',
            feedback: 'Looks right.',
            decided_by: 'u1',
            decided_at: base.resolved_at ?? '',
            answers: {},
          },
        }}
      />,
    )

    expect(screen.getByText(/Answered: Approve/)).toBeInTheDocument()
    expect(screen.getByText('Looks right.')).toBeInTheDocument()
  })
})
