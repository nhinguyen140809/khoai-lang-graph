import { describe, expect, it } from 'vitest'

import type { InterruptQuestion } from '@/modules/review/entities'

import { answerReviewFormSchema } from '../answer-review.schema'

const question = (fields: Partial<InterruptQuestion>): InterruptQuestion => ({
  key: 'users',
  type: 'single_select',
  prompt: 'Who uses the platform in their day, so the interviews ask the right people?',
  required: true,
  choices: [
    { key: 'students', label: 'Students', requires_text: false },
    { key: 'other', label: 'Someone else, please specify', requires_text: true },
  ],
  min_selected: null,
  max_selected: null,
  default_answer: null,
  source: 'definition',
  ...fields,
})

const schemaOf = (questions: InterruptQuestion[]) =>
  answerReviewFormSchema({
    options: [
      { key: 'accept', requires_feedback: false },
      { key: 'reject', requires_feedback: true },
    ],
    questions,
  })

describe('answerReviewFormSchema', () => {
  it('reports the problem of a question at its key', () => {
    const result = schemaOf([question({})]).safeParse({
      option: 'accept',
      feedback: '',
      answers: { users: { choice_keys: [], text: null, number: null } },
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(['answers', 'users'])
  })

  it('reports the feedback problem at feedback', () => {
    const result = schemaOf([]).safeParse({
      option: 'reject',
      feedback: '',
      answers: {},
    })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues[0]?.path).toEqual(['feedback'])
    expect(result.error.issues[0]?.message).toBe('Write the feedback.')
  })

  it('accepts a filled answer', () => {
    const result = schemaOf([question({})]).safeParse({
      option: 'accept',
      feedback: '',
      answers: { users: { choice_keys: ['students'], text: null, number: null } },
    })

    expect(result.success).toBe(true)
  })
})
