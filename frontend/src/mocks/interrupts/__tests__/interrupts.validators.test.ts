import { describe, expect, it } from 'vitest'

import type { Interrupt } from '@/modules/review/entities'
import { assertPresent } from '@/shared/lib/guards'
import { openPage } from '@/test/msw'

import { itemFixtureByKey } from '../../artifacts/fixtures/artifacts.fixtures'
import { findRun } from '../../runs/lookup/runs.lookup'
import { projectIds, runIds } from '../../shared/db'
import { pendingInterruptOf } from '../interrupts.lookup'
import { answerProblems, validateResumeBody } from '../interrupts.validators'
import {
  acceptedResumeBodyCases,
  answerCases,
  apiExampleAnswers,
  refusedResumeBodyCases,
} from './interrupts.validators.data'

// The review that run 3 of the mentor thread waits for, as the mock server holds it.
function pendingReview(): Interrupt {
  const run = assertPresent(findRun(runIds.mentorMain3), 'The mock data holds run 3.')
  return assertPresent(pendingInterruptOf(run), 'Run 3 waits for a review.')
}

describe('validateResumeBody', () => {
  it.each(acceptedResumeBodyCases)('accepts $name', ({ body, decision }) => {
    const checked = validateResumeBody(pendingReview(), body)

    expect(!('problems' in checked) && checked.decision).toMatchObject({
      interrupt_id: pendingReview().id,
      ...decision,
    })
  })

  it.each(refusedResumeBodyCases)('refuses $name', ({ body, problems }) => {
    const checked = validateResumeBody(pendingReview(), body)

    expect('problems' in checked && checked.problems).toEqual(problems)
  })

  it('refuses edits on an interrupt that does not allow them', () => {
    const edited = itemFixtureByKey(projectIds.mentor, 'AR-001')
    const checked = validateResumeBody(
      { ...pendingReview(), allow_edits: false },
      {
        option: 'accept',
        feedback: null,
        answers: {},
        modified_items: [{ item_id: edited.id, version: 1 }],
      },
    )

    expect('problems' in checked && checked.problems).toEqual([
      { field: 'modified_items', message: 'This review does not accept edits.' },
    ])
  })
})

describe('validateResumeBody of an interrupt that only asks questions', () => {
  it('accepts the answers of the example of the API', () => {
    openPage('/?mock-agent-questions=only')
    const pending = pendingReview()

    const checked = validateResumeBody(pending, {
      option: null,
      feedback: null,
      answers: apiExampleAnswers,
      modified_items: [],
    })

    expect(!('problems' in checked) && checked.decision).toMatchObject({
      interrupt_id: pending.id,
      option: null,
      feedback: null,
      answers: apiExampleAnswers,
      modified_items: [],
    })
  })

  it('refuses an option where the interrupt offers none', () => {
    openPage('/?mock-agent-questions=only')
    const checked = validateResumeBody(pendingReview(), {
      option: 'yes',
      feedback: null,
      answers: apiExampleAnswers,
      modified_items: [],
    })

    expect('problems' in checked && checked.problems).toEqual([
      { field: 'option', message: 'Choose one of the values.' },
    ])
  })

  it('refuses a required question left unanswered, at its key', () => {
    openPage('/?mock-agent-questions=only')
    const checked = validateResumeBody(pendingReview(), {
      option: null,
      feedback: null,
      answers: { payments: apiExampleAnswers.payments },
      modified_items: [],
    })

    expect('problems' in checked && checked.problems).toEqual([
      { field: 'answers.users', message: 'Answer this question.' },
    ])
  })

  it('refuses an answer to a key that is no question', () => {
    openPage('/?mock-agent-questions=only')
    const checked = validateResumeBody(pendingReview(), {
      option: null,
      feedback: null,
      answers: { ...apiExampleAnswers, color: { choice_keys: [], text: null, number: null } },
      modified_items: [],
    })

    expect('problems' in checked && checked.problems).toEqual([
      { field: 'answers.color', message: 'Answer a question of this review.' },
    ])
  })
})

describe('answerProblems', () => {
  it.each(answerCases)('reads $name', ({ question, answer, problems }) => {
    expect(answerProblems(question, answer, `answers.${question.key}`)).toEqual(problems)
  })
})
