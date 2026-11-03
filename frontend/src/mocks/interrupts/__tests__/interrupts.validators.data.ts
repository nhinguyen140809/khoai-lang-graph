import type { InterruptQuestion } from '@/modules/review/entities'
import type { FieldProblem } from '@/shared/api/error'
import { assertPresent } from '@/shared/lib/guards'

import { itemFixtureByKey } from '../../artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '../../shared/db'
import { agentQuestionFixtures } from '../interrupts.fixtures'

// The cases of the checks of the resume body: the review that run 3 waits for (the analysis, with
// its options and its edits), and the questions an agent adds at run time.

// The agent question with this key, one of the fixtures.
function question(key: string): InterruptQuestion {
  return assertPresent(
    agentQuestionFixtures.find(({ key: questionKey }) => questionKey === key),
    `No agent question ${key}.`,
  )
}

// A number the user must answer: the fixture question is one they may leave out.
const requiredNumber: InterruptQuestion = {
  ...question('sessions_per_week'),
  key: 'target_personas_num',
  required: true,
}

// A free text the user must answer: the fixture question is one they may leave out.
const requiredFreeText: InterruptQuestion = {
  ...question('notes'),
  key: 'concerns',
  required: true,
}

// A multi select with both bounds: the fixture question has a lower bound only.
const boundedMultiSelect: InterruptQuestion = {
  ...question('users'),
  key: 'audience',
  required: false,
  min_selected: 2,
  max_selected: 2,
}

/** A question, an answer to it, and the problems of the answer. */
export const answerCases = [
  {
    name: 'a multi select that picks its choices, with the text a choice asks for',
    question: question('users'),
    answer: { choice_keys: ['students', 'other'], text: 'Alumni who want to mentor', number: null },
    problems: [],
  },
  {
    name: 'a multi select that picks a key that is no choice',
    question: question('users'),
    answer: { choice_keys: ['students', 'visitors'], text: null, number: null },
    problems: [{ field: 'answers.users', message: 'Choose the choices of the question.' }],
  },
  {
    name: 'a required multi select that picks nothing',
    question: question('users'),
    answer: { choice_keys: [], text: null, number: null },
    problems: [{ field: 'answers.users', message: 'Choose at least one choice.' }],
  },
  {
    name: 'a multi select that picks a choice which asks for text, without the text',
    question: question('users'),
    answer: { choice_keys: ['other'], text: null, number: null },
    problems: [{ field: 'answers.users', message: 'Enter a value.' }],
  },
  {
    name: 'a multi select that picks fewer than its lower bound',
    question: boundedMultiSelect,
    answer: { choice_keys: ['students'], text: null, number: null },
    problems: [{ field: 'answers.audience', message: 'Choose at least 2 choices.' }],
  },
  {
    name: 'a multi select that picks more than its upper bound, one of which asks for text',
    question: boundedMultiSelect,
    answer: { choice_keys: ['students', 'mentors', 'other'], text: null, number: null },
    problems: [
      { field: 'answers.audience', message: 'Choose at most 2 choices.' },
      { field: 'answers.audience', message: 'Enter a value.' },
    ],
  },
  {
    name: 'a single select that picks one choice',
    question: question('payments'),
    answer: { choice_keys: ['no'], text: null, number: null },
    problems: [],
  },
  {
    name: 'a single select that picks two choices',
    question: question('payments'),
    answer: { choice_keys: ['yes', 'no'], text: null, number: null },
    problems: [{ field: 'answers.payments', message: 'Choose one of the choices.' }],
  },
  {
    name: 'a single select that picks a key that is no choice',
    question: question('payments'),
    answer: { choice_keys: ['maybe'], text: null, number: null },
    problems: [{ field: 'answers.payments', message: 'Choose one of the choices.' }],
  },
  {
    name: 'a number the user may leave out',
    question: question('sessions_per_week'),
    answer: { choice_keys: [], text: null, number: 3 },
    problems: [],
  },
  {
    name: 'a number that is not a number',
    question: question('sessions_per_week'),
    answer: { choice_keys: [], text: null, number: 'three' },
    problems: [{ field: 'answers.sessions_per_week', message: 'Send a number, or nothing.' }],
  },
  {
    name: 'a required number that is left out',
    question: requiredNumber,
    answer: { choice_keys: [], text: null, number: null },
    problems: [{ field: 'answers.target_personas_num', message: 'Enter a number.' }],
  },
  {
    name: 'a free text that holds the answer',
    question: question('notes'),
    answer: { choice_keys: [], text: 'Keep the budget low.', number: null },
    problems: [],
  },
  {
    name: 'a required free text that is left empty',
    question: requiredFreeText,
    answer: { choice_keys: [], text: '   ', number: null },
    problems: [{ field: 'answers.concerns', message: 'Enter a value.' }],
  },
  {
    name: 'an answer whose choices are not keys',
    question: question('notes'),
    answer: { choice_keys: 'none', text: null, number: null },
    problems: [{ field: 'answers.notes', message: 'Send the chosen choices as keys.' }],
  },
  {
    name: 'an answer that is not an object',
    question: question('notes'),
    answer: 'none',
    problems: [{ field: 'answers.notes', message: 'Send an object.' }],
  },
] satisfies {
  name: string
  question: InterruptQuestion
  answer: unknown
  problems: FieldProblem[]
}[]

// The analyzed requirement the user edited before answering, at its new version.
const editedItem = () => itemFixtureByKey(projectIds.mentor, 'AR-007')

/** A body that the review of run 3 accepts, and the decision that it describes. */
export const acceptedResumeBodyCases = [
  {
    name: 'the chosen option, without feedback',
    body: { option: 'accept', feedback: null, answers: {}, modified_items: [] },
    decision: { option: 'accept', feedback: null, answers: {}, modified_items: [] },
  },
  {
    name: 'a reject with its feedback and an edited item',
    body: {
      option: 'reject_reinterview',
      feedback: 'Ask the student and the admin whether a layered design works for both.',
      answers: {},
      modified_items: [{ item_id: editedItem().id, version: 2 }],
    },
    decision: {
      option: 'reject_reinterview',
      feedback: 'Ask the student and the admin whether a layered design works for both.',
      answers: {},
      modified_items: [{ item_id: editedItem().id, version: 2 }],
    },
  },
  {
    name: 'a feedback that the option does not ask for',
    body: { option: 'accept', feedback: 'Fine as it is.', answers: {}, modified_items: [] },
    decision: { option: 'accept', feedback: 'Fine as it is.', answers: {}, modified_items: [] },
  },
] satisfies {
  name: string
  body: Record<string, unknown>
  decision: {
    option: string | null
    feedback: string | null
    answers: Record<string, unknown>
    modified_items: { item_id: string; version: number }[]
  }
}[]

// An item of the analysis, for a case that edits one.
const anyItem = () => itemFixtureByKey(projectIds.mentor, 'AR-001')

/** A body that the review of run 3 refuses, and the problems of its fields. */
export const refusedResumeBodyCases = [
  {
    name: 'an option the review does not offer',
    body: { option: 'unknown', feedback: null, answers: {}, modified_items: [] },
    problems: [{ field: 'option', message: 'Choose one of the values.' }],
  },
  {
    name: 'no feedback for an option that asks for it',
    body: { option: 'reject_reanalyse', feedback: null, answers: {}, modified_items: [] },
    problems: [{ field: 'feedback', message: 'Enter a value.' }],
  },
  {
    name: 'a feedback that is not text',
    body: { option: 'accept', feedback: 5, answers: {}, modified_items: [] },
    problems: [{ field: 'feedback', message: 'Enter text, or nothing.' }],
  },
  {
    name: 'answers that are not an object',
    body: { option: 'accept', feedback: null, answers: 'none', modified_items: [] },
    problems: [{ field: 'answers', message: 'Send an object.' }],
  },
  {
    name: 'edited items that are not a list',
    body: { option: 'accept', feedback: null, answers: {}, modified_items: 'AR-007' },
    problems: [{ field: 'modified_items', message: 'Send a list.' }],
  },
  {
    name: 'an edited item that does not exist',
    body: {
      option: 'accept',
      feedback: null,
      answers: {},
      modified_items: [{ item_id: 'no-such-item', version: 1 }],
    },
    problems: [{ field: 'modified_items.0', message: 'This item does not exist.' }],
  },
  {
    name: 'an edited item without a version from 1',
    body: {
      option: 'accept',
      feedback: null,
      answers: {},
      modified_items: [{ item_id: anyItem().id, version: 0 }],
    },
    problems: [{ field: 'modified_items.0', message: 'Enter a number from 1.' }],
  },
] satisfies {
  name: string
  body: Record<string, unknown>
  problems: FieldProblem[]
}[]

/** The answers of the example of the API, to an interrupt that only asks questions. */
export const apiExampleAnswers = {
  users: { choice_keys: ['students', 'other'], text: 'Alumni who want to mentor', number: null },
  payments: { choice_keys: ['no'], text: null, number: null },
  sessions_per_week: { choice_keys: [], text: null, number: 3 },
} as const
