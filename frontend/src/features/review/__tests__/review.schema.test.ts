import { describe, expect, it } from 'vitest'

import { reviewFormSchema } from '../review.schema'
import type { Interrupt, Question } from '../review.types'

const asked: Question = {
  key: 'users',
  type: 'multi_select',
  prompt: 'Who will use it?',
  required: true,
  choices: [{ key: 'students', label: 'Students', requires_text: false }],
  min_selected: null,
  max_selected: null,
  default_answer: { choice_keys: [], text: null, number: null },
  source: 'agent',
}

const interrupt: Interrupt = {
  id: 'i1',
  run_id: 'r1',
  step_id: null,
  node: 'checkpoint',
  prompt: 'Review it.',
  options: [
    { key: 'accept', label: 'Accept', requires_feedback: false, approves: true, is_default: true },
    { key: 'reject', label: 'Reject', requires_feedback: true, approves: false, is_default: false },
  ],
  questions: [asked],
  allow_edits: true,
  review_artifacts: [],
  status: 'pending',
  created_at: '2026-10-06T08:41:12Z',
  resolved_at: null,
}

const edited = [{ id: 'a', key: 'AR-007', version: 2, updated_by: { actor: 'user' as const } }]

describe('reviewFormSchema', () => {
  const schema = reviewFormSchema(interrupt, edited)

  it('gives the body of the resume request, with the edited items', () => {
    const answers = { users: { choice_keys: ['students'], text: null, number: null } }

    expect(schema.parse({ option: 'reject', feedback: ' Redo it. ', answers })).toEqual({
      interrupt_id: 'i1',
      option: 'reject',
      feedback: 'Redo it.',
      answers,
      modified_items: [{ item_id: 'a', version: 2 }],
    })
  })

  it('names the field of each problem, with the answers under their question', () => {
    const result = schema.safeParse({
      option: 'reject',
      feedback: '',
      answers: { users: asked.default_answer },
    })

    expect(result.error?.issues.map(({ path, message }) => [path, message])).toEqual([
      [['feedback'], 'Write the feedback.'],
      [['answers', 'users'], 'Choose at least one.'],
    ])
  })
})
