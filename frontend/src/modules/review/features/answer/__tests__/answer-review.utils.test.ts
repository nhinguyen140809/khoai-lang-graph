import { describe, expect, it } from 'vitest'

import type { ArtifactItem } from '@/modules/artifact/entities'
import type { InterruptOption, InterruptQuestion } from '@/modules/review/entities'
import type { CheckpointOption, QuestionAnswer } from '@/modules/workflow/entities'

import {
  answerProblem,
  defaultOption,
  feedbackAfterSelect,
  initialAnswers,
  modifiedItemsOf,
  resumeRunBody,
} from '../answer-review.utils'

const options: CheckpointOption[] = [
  { key: 'accept', label: 'Accept', requires_feedback: false, approves: true, is_default: true },
  { key: 'reject', label: 'Reject', requires_feedback: true, approves: false, is_default: false },
]

const question = (fields: Partial<InterruptQuestion>): InterruptQuestion => ({
  key: 'users',
  type: 'single_select',
  prompt: 'Who uses the platform in their day, so the interviews ask the right people?',
  required: true,
  choices: [],
  min_selected: null,
  max_selected: null,
  default_answer: null,
  source: 'definition',
  ...fields,
})

const answer = (fields: Partial<QuestionAnswer>): QuestionAnswer => ({
  choice_keys: [],
  text: null,
  number: null,
  ...fields,
})

describe('defaultOption', () => {
  it('takes the default option, else the first; none without options', () => {
    expect(defaultOption(options)?.key).toBe('accept')
    const second = options.find(({ key }) => key === 'reject')
    expect(defaultOption(second === undefined ? [] : [second])?.key).toBe('reject')
    expect(defaultOption<CheckpointOption>([])).toBeUndefined()
  })
})

describe('initialAnswers', () => {
  it('fills each question with its default answer, and an empty one without', () => {
    const answers = initialAnswers([
      question({ default_answer: answer({ choice_keys: ['yes'] }) }),
      question({ key: 'notes', type: 'free_text', required: false }),
    ])

    expect(answers.users).toEqual(answer({ choice_keys: ['yes'] }))
    expect(answers.notes).toEqual(answer({}))
  })
})

describe('answerProblem', () => {
  it.each([
    {
      name: 'a required single select with no choice',
      question: question({}),
      answer: undefined,
      problem: { type: 'chooseOne' } as const,
    },
    {
      name: 'a multi select under its least count',
      question: question({ type: 'multi_select', min_selected: 2, required: false }),
      answer: answer({ choice_keys: ['students'] }),
      problem: { type: 'chooseAtLeast', count: 2 } as const,
    },
    {
      name: 'a multi select over its most count',
      question: question({ type: 'multi_select', min_selected: null, max_selected: 1 }),
      answer: answer({ choice_keys: ['students', 'mentors'] }),
      problem: { type: 'chooseAtMost', count: 1 } as const,
    },
    {
      name: 'a required free text without words',
      question: question({ type: 'free_text' }),
      answer: answer({ text: '  ' }),
      problem: { type: 'writeAnswer' } as const,
    },
    {
      name: 'a required number without one',
      question: question({ type: 'number' }),
      answer: answer({}),
      problem: { type: 'enterNumber' } as const,
    },
    {
      name: 'a choice that requires text without it',
      question: question({
        type: 'multi_select',
        required: false,
        choices: [{ key: 'other', label: 'Someone else, please specify', requires_text: true }],
      }),
      answer: answer({ choice_keys: ['other'] }),
      problem: { type: 'explainChoice', label: 'Someone else, please specify' } as const,
    },
  ])('reports $name', ({ question: asked, answer: given, problem }) => {
    expect(answerProblem(asked, given)).toEqual(problem)
  })

  it('reports nothing for a valid answer', () => {
    expect(answerProblem(question({}), answer({ choice_keys: ['students'] }))).toBeNull()
  })
})

describe('resumeRunBody and modifiedItemsOf', () => {
  it('builds the body with the chosen option, the feedback trimmed and the answers', () => {
    const body = resumeRunBody(
      { id: 'i1', allow_edits: true } as never,
      {
        option: 'reject',
        feedback: '  Ask both sides.  ',
        answers: { users: answer({ choice_keys: ['students'] }) },
      },
      [],
    )

    expect(body).toMatchObject({
      interrupt_id: 'i1',
      option: 'reject',
      feedback: 'Ask both sides.',
      modified_items: [],
    })
  })

  it('gives no modified item when the review does not take edits', () => {
    const items = [{ id: 'i1', version: 2 } as ArtifactItem]

    expect(modifiedItemsOf({ allow_edits: false }, items)).toEqual([])
    expect(modifiedItemsOf({ allow_edits: true }, items)).toEqual([{ item_id: 'i1', version: 2 }])
  })
})

describe('feedbackAfterSelect', () => {
  const [accept, reject] = options as [InterruptOption, InterruptOption]
  const withSuggestion: InterruptOption = { ...reject, suggested_feedback: 'Settle the conflicts.' }
  const another: InterruptOption = {
    ...reject,
    key: 'redo',
    suggested_feedback: 'Interview again.',
  }

  it('fills the feedback with the suggestion of the option that was chosen', () => {
    expect(feedbackAfterSelect('', accept, withSuggestion)).toBe('Settle the conflicts.')
    expect(feedbackAfterSelect('   ', undefined, withSuggestion)).toBe('Settle the conflicts.')
  })

  it('replaces the suggestion of the earlier option, which the user did not touch', () => {
    expect(feedbackAfterSelect('Settle the conflicts.', withSuggestion, another)).toBe(
      'Interview again.',
    )
  })

  it('empties the feedback that was only a suggestion when the new option suggests none', () => {
    expect(feedbackAfterSelect('Settle the conflicts.', withSuggestion, accept)).toBe('')
  })

  it('keeps what the user wrote', () => {
    expect(feedbackAfterSelect('Ask the mentors too.', withSuggestion, another)).toBe(
      'Ask the mentors too.',
    )
  })
})
