import { describe, expect, it } from 'vitest'

import type { Interrupt, Question, ReviewOption } from '../review.types'
import {
  buildResumeBody,
  defaultOption,
  editedItems,
  initialAnswers,
  validateReview,
} from '../review-form.utils'

const accept: ReviewOption = {
  key: 'accept',
  label: 'Accept',
  requires_feedback: false,
  approves: true,
  is_default: true,
}
const reject: ReviewOption = {
  key: 'reject',
  label: 'Reject',
  requires_feedback: true,
  approves: false,
  is_default: false,
}

function question(fields: Partial<Question> & Pick<Question, 'key' | 'type'>): Question {
  return {
    prompt: 'A question?',
    required: true,
    choices: [],
    min_selected: null,
    max_selected: null,
    default_answer: { choice_keys: [], text: null, number: null },
    source: 'agent',
    ...fields,
  }
}

function interrupt(fields: Partial<Interrupt> = {}): Interrupt {
  return {
    id: 'i1',
    run_id: 'r1',
    step_id: null,
    node: 'checkpoint',
    prompt: 'Review it.',
    options: [accept, reject],
    questions: [],
    allow_edits: true,
    review_artifacts: [],
    status: 'pending',
    created_at: '2026-10-06T08:41:12Z',
    resolved_at: null,
    ...fields,
  }
}

describe('defaultOption', () => {
  it('is the option marked as the default, else the first', () => {
    expect(defaultOption([reject, accept])).toBe(accept)
    expect(defaultOption([reject])).toBe(reject)
    expect(defaultOption([])).toBeUndefined()
  })
})

describe('initialAnswers', () => {
  it('starts each question with its default answer', () => {
    const asked = question({
      key: 'users',
      type: 'multi_select',
      default_answer: { choice_keys: ['a'], text: null, number: null },
    })

    expect(initialAnswers([asked])).toEqual({ users: asked.default_answer })
  })
})

describe('validateReview', () => {
  it('asks for the feedback that an option needs', () => {
    expect(validateReview(interrupt(), { option: reject, feedback: '  ', answers: {} })).toEqual({
      feedback: 'Write the feedback.',
    })
    expect(validateReview(interrupt(), { option: accept, feedback: '', answers: {} })).toEqual({})
  })

  it('asks for a choice when the checkpoint has options and none is chosen', () => {
    expect(validateReview(interrupt(), { option: undefined, feedback: '', answers: {} })).toEqual({
      option: 'Choose one.',
    })
  })

  it('checks each type of question', () => {
    const asked = interrupt({
      options: [],
      questions: [
        question({ key: 'one', type: 'single_select' }),
        question({ key: 'many', type: 'multi_select', min_selected: 2, max_selected: 3 }),
        question({ key: 'text', type: 'free_text' }),
        question({ key: 'count', type: 'number' }),
        question({ key: 'optional', type: 'number', required: false }),
      ],
    })
    const empty = { choice_keys: [], text: null, number: null }

    const problems = validateReview(asked, {
      option: undefined,
      feedback: '',
      answers: { one: empty, many: { ...empty, choice_keys: ['a'] }, text: empty, count: empty },
    })

    expect(problems).toEqual({
      one: 'Choose one.',
      many: 'Choose at least 2.',
      text: 'Write an answer.',
      count: 'Enter a number.',
    })
  })

  it('asks for the words that a choice needs', () => {
    const asked = interrupt({
      options: [],
      questions: [
        question({
          key: 'users',
          type: 'multi_select',
          choices: [
            { key: 'students', label: 'Students', requires_text: false },
            { key: 'other', label: 'Someone else', requires_text: true },
          ],
        }),
      ],
    })

    expect(
      validateReview(asked, {
        option: undefined,
        feedback: '',
        answers: { users: { choice_keys: ['other'], text: ' ', number: null } },
      }),
    ).toEqual({ users: 'Say more for "Someone else".' })
  })
})

describe('editedItems and buildResumeBody', () => {
  const items = [
    { id: 'a', key: 'AR-007', version: 2, updated_by: { actor: 'user' as const } },
    { id: 'b', key: 'AR-008', version: 1, updated_by: { actor: 'agent' as const } },
    { id: 'c', key: 'AR-009', version: 3, updated_by: { actor: 'agent' as const } },
  ]

  it('finds the items that the user changed', () => {
    expect(editedItems(items).map(({ key }) => key)).toEqual(['AR-007'])
  })

  it('lists the edited items and the feedback only when the review takes them', () => {
    const edited = editedItems(items)

    expect(
      buildResumeBody(interrupt(), { option: reject, feedback: ' Redo it. ', answers: {}, edited }),
    ).toEqual({
      interrupt_id: 'i1',
      option: 'reject',
      feedback: 'Redo it.',
      answers: {},
      modified_items: [{ item_id: 'a', version: 2 }],
    })
    expect(
      buildResumeBody(interrupt({ allow_edits: false }), {
        option: accept,
        feedback: 'ignored',
        answers: {},
        edited,
      }),
    ).toMatchObject({ option: 'accept', feedback: null, modified_items: [] })
  })
})
