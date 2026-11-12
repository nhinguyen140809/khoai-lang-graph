import { describe, expect, it } from 'vitest'

import type { ArtifactItem } from '@/modules/artifact/entities'
import type { InterruptOption, InterruptQuestion } from '@/modules/review/entities'
import type { CheckpointOption, QuestionAnswer } from '@/modules/workflow/entities'
import { ApiError } from '@/shared/api/error'

import {
  answerProblem,
  answersOf,
  defaultOption,
  feedbackAfterSelect,
  initialAnswers,
  isChoice,
  isChosen,
  isKeptByField,
  isTextLine,
  modifiedItemsOf,
  neighborOf,
  problemsOf,
  resumeRunBody,
  stepKeyOf,
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

describe('neighborOf', () => {
  const list = ['a', 'b', 'c']

  it('gives the element before and after, and none past the ends', () => {
    expect(neighborOf(list, 'b', 1)).toBe('c')
    expect(neighborOf(list, 'b', -1)).toBe('a')
    expect(neighborOf(list, 'c', 1)).toBeUndefined()
    expect(neighborOf(list, 'a', -1)).toBeUndefined()
  })

  it('gives the first going down and the last going up for an element that is not in the list', () => {
    expect(neighborOf(list, 'x', 1)).toBe('a')
    expect(neighborOf(list, 'x', -1)).toBe('c')
  })
})

describe('problemsOf', () => {
  it('names each field that the API found wrong, one line for each', () => {
    const error = new ApiError('Validation failed', 422, 'validation_failed', [
      { field: 'answers.users', message: 'Answer this question.' },
      { field: 'option', message: 'Choose one of: accept, reject.' },
    ])

    expect(problemsOf(error)).toBe(
      'answers.users: Answer this question.\noption: Choose one of: accept, reject.',
    )
  })

  it('says nothing for an error that names no field', () => {
    expect(problemsOf(new ApiError('Down', 500, null, []))).toBeUndefined()
    expect(problemsOf(new Error('Offline'))).toBeUndefined()
  })
})

describe('stepKeyOf', () => {
  const press = (key: string, held: Partial<KeyboardEvent> = {}) => ({
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...held,
  })

  it('reads an arrow key as a move to a step or to an answer', () => {
    expect(stepKeyOf(press('ArrowRight'))).toEqual({ kind: 'step', by: 1 })
    expect(stepKeyOf(press('ArrowUp'))).toEqual({ kind: 'answer', by: -1 })
  })

  it('ignores another key and an arrow with a modifier held', () => {
    expect(stepKeyOf(press('a'))).toBeUndefined()
    expect(stepKeyOf(press('ArrowLeft', { shiftKey: true }))).toBeUndefined()
  })
})

describe('isKeptByField', () => {
  const step = { kind: 'step', by: 1 } as const
  const answer = { kind: 'answer', by: 1 } as const

  it('keeps every arrow in a box of text', () => {
    expect(isKeptByField(document.createElement('textarea'), step)).toBe(true)
  })

  it('lets go of the arrow that leaves a line of text at the edge of its caret', () => {
    const input = document.createElement('input')
    input.value = 'abc'
    input.setSelectionRange(3, 3)
    expect(isKeptByField(input, step)).toBe(false)
    input.setSelectionRange(1, 1)
    expect(isKeptByField(input, step)).toBe(true)
    expect(isKeptByField(input, answer)).toBe(true)
  })

  it('lets every arrow through a radio button and anything that is not a field', () => {
    const radio = document.createElement('input')
    radio.type = 'radio'
    expect(isKeptByField(radio, answer)).toBe(false)
    expect(isKeptByField(document.createElement('button'), answer)).toBe(false)
  })
})

describe('the controls of a step', () => {
  function formWith(html: string): HTMLFormElement {
    const form = document.createElement('form')
    form.innerHTML = html
    document.body.append(form)
    return form
  }

  it('tells a choice from a line of text', () => {
    const form = formWith(
      '<input type="radio"><input type="checkbox"><button type="button" role="radio"></button><input type="text"><input type="number"><button type="submit"></button>',
    )
    const controls = Array.from(form.elements)

    expect(controls.map((element) => isChoice(element))).toEqual([
      true,
      true,
      true,
      false,
      false,
      false,
    ])
    expect(controls.map((element) => isTextLine(element))).toEqual([
      false,
      false,
      false,
      true,
      true,
      false,
    ])
  })

  it('tells the choice that is chosen, for an input and for an option of the review', () => {
    const form = formWith(
      '<input type="radio" checked><button type="button" role="radio" aria-checked="true"></button><button type="button" role="radio" aria-checked="false"></button>',
    )

    expect(answersOf(form).map((element) => isChosen(element))).toEqual([true, true, false])
  })

  it('leaves out the controls of a step that is inert, such as the one sliding out of view', () => {
    const form = formWith(
      '<div inert><input type="radio"></div><div><input type="radio" id="shown"></div>',
    )

    expect(answersOf(form).map(({ id }) => id)).toEqual(['shown'])
  })
})
