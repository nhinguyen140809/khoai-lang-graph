import { describe, expect, it } from 'vitest'

import { interruptsOfRun } from '@/mocks/interrupts/interrupts.lookup'
import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds, userId } from '@/mocks/shared/db'
import type { Run } from '@/modules/run/entities'

import { answerLines, decisionOption } from '../interrupts.utils'

// Run 1 of the mentor thread, which went through the whole workflow.
const mentorRun1: Run = buildRun({
  id: runIds.mentorMain1,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 1,
  status: 'succeeded',
  current_stage: 'done',
})

describe('decisionOption', () => {
  it('gives the option that answered a resolved review, and its decision', () => {
    const [personas] = interruptsOfRun(mentorRun1)
    const decision = personas?.decision

    expect(decision).toMatchObject({ option: 'approve', decided_by: userId })
    expect(decisionOption(personas ?? { options: [], decision: null })?.label).toBe(
      'Approve the interviewees',
    )
  })

  it('gives null while a review waits, and for one taken with the defaults of its checkpoint', () => {
    const failedRun = buildRun({
      id: runIds.mentorMain2,
      thread_id: threadIds.mentorMain,
      project_id: projectIds.mentor,
      number: 2,
      status: 'failed',
      current_stage: 'specification',
    })
    const [personasOfFailed] = interruptsOfRun(failedRun)

    expect(personasOfFailed?.decision?.decided_by).toBeNull()
    expect(personasOfFailed?.decision?.option).toBe('approve')
  })

  it('gives null for a pending interrupt without a decision', () => {
    expect(decisionOption({ options: [], decision: null })).toBeNull()
  })
})

describe('answerLines', () => {
  const question = (key: string, prompt: string, choices: { key: string; label: string }[] = []) =>
    ({
      key,
      type: choices.length > 0 ? 'single_select' : 'free_text',
      prompt,
      required: false,
      choices: choices.map((choice) => ({ ...choice, requires_text: false })),
      min_selected: null,
      max_selected: null,
      default_answer: null,
      source: 'agent',
    }) as const
  const answer = (
    choice_keys: string[],
    text: string | null = null,
    number: number | null = null,
  ) => ({
    choice_keys,
    text,
    number,
  })

  it('words each answered question with the labels of the choices, then the text', () => {
    const lines = answerLines({
      questions: [
        question('who', 'Who books?', [
          { key: 'students', label: 'Students' },
          { key: 'other', label: 'Other' },
        ]),
        question('notes', 'Anything else?'),
      ],
      decision: {
        option: null,
        feedback: null,
        decided_by: 'u1',
        decided_at: '2026-10-06T08:30:00Z',
        answers: { who: answer(['students', 'other'], 'Alumni'), notes: answer([], 'No.') },
      },
    })

    expect(lines).toEqual([
      { prompt: 'Who books?', text: 'Students, Other, Alumni' },
      { prompt: 'Anything else?', text: 'No.' },
    ])
  })

  it('leaves out a question that was left blank, and gives a number as it was typed', () => {
    const lines = answerLines({
      questions: [question('a', 'A?'), question('b', 'How many?')],
      decision: {
        option: null,
        feedback: null,
        decided_by: null,
        decided_at: '2026-10-06T08:30:00Z',
        answers: { a: answer([], '  '), b: answer([], null, 12) },
      },
    })

    expect(lines).toEqual([{ prompt: 'How many?', text: '12' }])
  })

  it('has nothing for an interrupt that no decision resolved', () => {
    expect(answerLines({ questions: [question('a', 'A?')], decision: null })).toEqual([])
  })
})
